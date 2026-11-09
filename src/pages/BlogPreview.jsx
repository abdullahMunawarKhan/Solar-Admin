import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchBlogById } from '../services/blogs';
import { publishBlog } from '../services/publishing';
import { formatDate } from '../utils/date';
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Send,
  AlertTriangle,
  Calendar,
  User,
  Share2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export function BlogPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchBlogById(id);
        setBlog(data);
      } catch (err) {
        console.error('Failed to load blog for preview:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handlePublishNow = async () => {
    try {
      setPublishing(true);
      setPublishError(null);
      await publishBlog(id);
      setPublishSuccess(true);
      setTimeout(() => {
        navigate('/blogs');
      }, 1500);
    } catch (err) {
      setPublishError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-solar-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Generating live preview...</span>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Blog post not found.</p>
        <Link to="/blogs" className="text-solar-600 font-bold hover:underline mt-2 inline-block">
          Return to All Blogs
        </Link>
      </div>
    );
  }

  const defaultOrigin = (import.meta.env.VITE_SITE_ORIGIN || 'https://www.proudindiansolar.com').replace(/\/$/, '');
  const publicUrl = blog.canonical_url || `${defaultOrigin}/blog/${blog.slug}.html`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Draft Alert Banner */}
      <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Unpublished Preview Mode</h4>
            <p className="text-xs text-amber-800">
              This preview mimics the live static HTML page output. It is not publicly accessible until published.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-amber-100/70 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'desktop'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-amber-800 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'mobile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-amber-800 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {publishError && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm">
          {publishError}
        </div>
      )}

      {publishSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Successfully published and committed! Redirecting to dashboard...</span>
        </div>
      )}

      {/* Floating Control Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs sticky top-20 z-20">
        <button
          onClick={() => navigate(`/blogs/edit/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Editor</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePublishNow}
            disabled={publishing || publishSuccess}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-solar-500 hover:bg-solar-600 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {publishing ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{publishing ? 'Publishing...' : 'Publish to Live Website'}</span>
          </button>
        </div>
      </div>

      {/* Preview Container Frame */}
      <div
        className={`mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
          viewMode === 'mobile' ? 'max-w-[420px]' : 'w-full'
        }`}
      >
        {/* Mock Browser URL Bar */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
          </div>
          <div className="flex-1 bg-white px-3 py-1 rounded-md text-[11px] font-mono text-slate-500 border border-slate-200 truncate text-center">
            {publicUrl}
          </div>
        </div>

        {/* Mock Site Header */}
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-white">
          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-solar-500"></div>
            <span>Proud Indian Solar</span>
          </div>
          <div className="text-xs text-slate-500 hidden sm:flex gap-4">
            <span>Home</span>
            <span>About</span>
            <span className="text-solar-600 font-bold">Blog</span>
            <span>Contact</span>
          </div>
        </div>

        {/* Article Body */}
        <article className="p-6 sm:p-10 max-w-3xl mx-auto font-sans">
          {/* Breadcrumbs */}
          <div className="text-xs text-slate-400 mb-4 flex items-center gap-1.5">
            <span>Home</span>
            <span>/</span>
            <span>Blogs</span>
            <span>/</span>
            <span className="text-slate-600 font-medium truncate">{blog.title}</span>
          </div>

          {/* Category */}
          {blog.category && (
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold tracking-wide uppercase mb-3">
              {blog.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4">
            {blog.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-6 border-b border-slate-200 mb-8">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>By {blog.author_name || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published: {formatDate(blog.published_at || new Date())}</span>
            </div>
          </div>

          {/* Featured Image */}
          {blog.featured_image && (
            <div className="rounded-xl overflow-hidden mb-8 shadow-sm max-h-[420px] bg-slate-100">
              <img
                src={blog.featured_image}
                alt={blog.image_alt || blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* HTML Content */}
          <div
            className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-base space-y-4"
            dangerouslySetInnerHTML={{ __html: blog.content_html || '' }}
          />
        </article>

        {/* Mock Site Footer */}
        <div className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-xs border-t border-slate-800">
          <p>&copy; {new Date().getFullYear()} Proud Indian Solar. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
