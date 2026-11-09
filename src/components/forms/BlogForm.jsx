import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { slugify, isValidSlug } from '../../utils/slugify';
import { RichTextEditor } from '../editor/RichTextEditor';
import { ImageUploader } from './ImageUploader';
import { SeoFields } from './SeoFields';
import { checkSlugAvailable } from '../../services/blogs';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Save,
  Send,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const CATEGORIES = [
  'Solar Energy',
  'Maintenance & Care',
  'Commercial Solar',
  'Residential Solar',
  'Government Schemes',
  'Technology & Inverters',
  'Battery Storage',
  'Company News',
];

export function BlogForm({
  initialData = {},
  onSubmit,
  onPublish,
  isEdit = false,
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: null,
    content_html: '',
    featured_image: '',
    image_alt: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    author_name: 'Solar Expert Team',
    category: 'Solar Energy',
    status: 'draft',
    ...initialData,
  });

  const [isSlugCustomized, setIsSlugCustomized] = useState(Boolean(initialData.slug));
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle title changes & auto-slug generation
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setIsDirty(true);
    setFormData((prev) => {
      const updated = { ...prev, title: newTitle };
      if (!isSlugCustomized) {
        updated.slug = slugify(newTitle);
      }
      return updated;
    });
  };

  // Check slug uniqueness with debounce
  useEffect(() => {
    if (!formData.slug) return;

    const timer = setTimeout(async () => {
      if (!isValidSlug(formData.slug)) {
        setSlugStatus({
          checking: false,
          available: false,
          message: 'Invalid slug. Use only lowercase letters, numbers, and hyphens.',
        });
        return;
      }

      setSlugStatus({ checking: true, available: true, message: 'Checking availability...' });
      const available = await checkSlugAvailable(formData.slug, initialData.id);
      setSlugStatus({
        checking: false,
        available,
        message: available ? 'Slug available' : 'This slug is already in use.',
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.slug, initialData.id]);

  const handleChange = (field, value) => {
    setIsDirty(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditorChange = ({ html, json }) => {
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      content_html: html,
      content: json,
    }));
  };

  const validate = () => {
    if (!formData.title.trim()) {
      return 'Blog title is required.';
    }
    if (!formData.slug.trim()) {
      return 'URL slug is required.';
    }
    if (!slugStatus.available) {
      return slugStatus.message || 'Please choose a unique URL slug.';
    }
    if (!formData.content_html || formData.content_html === '<p></p>') {
      return 'Blog body content cannot be empty.';
    }
    if (formData.featured_image && !formData.image_alt?.trim()) {
      return 'Image alt text is required for accessibility and SEO when a featured image is set.';
    }
    return null;
  };

  const handleSaveDraft = async (e) => {
    if (e) e.preventDefault();
    setFormError(null);
    if (!formData.title.trim()) {
      setFormError('Please enter at least a blog title to save a draft.');
      return;
    }

    try {
      setSavingDraft(true);
      const saved = await onSubmit({ ...formData, status: formData.status === 'published' ? 'published' : 'draft' });
      setIsDirty(false);
      return saved;
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublishConfirm = async () => {
    setShowPublishModal(false);
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setPublishing(true);
      setFormError(null);
      // 1. Save draft first to persist changes
      const saved = await onSubmit({ ...formData });
      setIsDirty(false);
      // 2. Trigger publishing endpoint
      if (onPublish) {
        await onPublish(saved?.id || initialData.id);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    // If not saved yet, save draft first then navigate to preview
    let targetId = initialData.id;
    if (isDirty || !targetId) {
      const saved = await handleSaveDraft();
      if (!saved) return;
      targetId = saved.id;
    }
    navigate(`/blogs/preview/${targetId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs sticky top-20 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Back to blogs list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Edit Blog Article' : 'Create New Blog'}
              </h2>
              <StatusBadge status={formData.status} />
            </div>
            {isDirty && (
              <span className="text-xs text-amber-600 font-medium">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePreview}
            disabled={savingDraft || publishing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || publishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            disabled={savingDraft || publishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-solar-500 hover:bg-solar-600 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{publishing ? 'Publishing...' : 'Publish to Live Site'}</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1 font-medium">{formError}</div>
        </div>
      )}

      {/* Main Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                Blog Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5 Crucial Solar Panel Maintenance Tips for Maximum Efficiency"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-3 text-base font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
                required
              />
            </div>

            {/* URL Slug */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSlugCustomized(!isSlugCustomized)}
                  className="text-xs text-solar-600 hover:text-solar-700 flex items-center gap-1 font-medium"
                >
                  {isSlugCustomized ? (
                    <>
                      <Unlock className="w-3 h-3" />
                      <span>Custom slug (Click to auto-generate from title)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Auto-generating from title (Click to edit)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center">
                <span className="px-3 py-2 bg-slate-100 text-slate-500 border border-r-0 border-slate-300 rounded-l-lg text-xs font-mono">
                  /blog/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  disabled={!isSlugCustomized}
                  onChange={(e) => {
                    setIsSlugCustomized(true);
                    handleChange('slug', slugify(e.target.value));
                  }}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 disabled:bg-slate-50 disabled:text-slate-600"
                  placeholder="solar-panel-maintenance-tips"
                  required
                />
              </div>

              {formData.slug && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  {slugStatus.checking ? (
                    <span className="text-slate-400">Checking availability...</span>
                  ) : slugStatus.available ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Available</span>
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{slugStatus.message}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Article Excerpt / Short Summary
              </label>
              <textarea
                rows={3}
                placeholder="A concise summary shown on the blog cards and archive listing..."
                value={formData.excerpt}
                onChange={(e) => handleChange('excerpt', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
              />
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <label className="block text-sm font-semibold text-slate-900">
              Blog Content <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              content={formData.content_html || formData.content}
              onChange={handleEditorChange}
            />
          </div>

          {/* SEO Metadata Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <SeoFields
              title={formData.title}
              slug={formData.slug}
              metaTitle={formData.meta_title}
              metaDescription={formData.meta_description}
              canonicalUrl={formData.canonical_url}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Right 1 Col: Metadata & Media */}
        <div className="space-y-6">
          {/* Post Details */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
              Publishing Details
            </h3>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Author Name
              </label>
              <input
                type="text"
                value={formData.author_name}
                onChange={(e) => handleChange('author_name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
                placeholder="Solar Expert Team"
              />
            </div>

            {/* Commit Sha & Info if published */}
            {formData.published_commit_sha && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Last Live Commit</div>
                <div className="font-mono text-[11px] truncate text-slate-500">
                  {formData.published_commit_sha}
                </div>
              </div>
            )}
          </div>

          {/* Featured Image */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <ImageUploader
              imageUrl={formData.featured_image}
              imageAlt={formData.image_alt}
              slug={formData.slug}
              onImageChange={(url) => handleChange('featured_image', url)}
              onAltChange={(alt) => handleChange('image_alt', alt)}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal before publishing */}
      <ConfirmModal
        isOpen={showPublishModal}
        title="Publish Blog to Live Website?"
        message={`This will generate the static HTML page, update blogs.html and sitemap.xml, and commit the changes to your main website repository. Netlify will automatically deploy the update.`}
        confirmText="Confirm &amp; Publish"
        cancelText="Cancel"
        isLoading={publishing}
        onConfirm={handlePublishConfirm}
        onCancel={() => setShowPublishModal(false)}
      />
    </div>
  );
}
