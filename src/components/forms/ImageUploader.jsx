import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadBlogImage, validateImageFile } from '../../services/storage';

export function ImageUploader({
  imageUrl,
  imageAlt,
  onImageChange,
  onAltChange,
  slug = 'blog',
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    try {
      setUploading(true);
      const { publicUrl } = await uploadBlogImage(file, slug);
      onImageChange(publicUrl);
      if (!imageAlt) {
        onAltChange(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onImageChange('');
    onAltChange('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-slate-900">
        Featured Image
      </label>

      {imageUrl ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video max-h-64 group">
            <img
              src={imageUrl}
              alt={imageAlt || 'Featured blog image preview'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Image Alt Text <span className="text-red-500">*</span> (SEO &amp; Accessibility)
            </label>
            <input
              type="text"
              placeholder="e.g. Technician inspecting rooftop solar panels"
              value={imageAlt || ''}
              onChange={(e) => onAltChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
              required
            />
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-solar-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-white hover:bg-solar-50/20"
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-solar-50 text-solar-600 flex items-center justify-center mb-3">
            {uploading ? (
              <span className="w-5 h-5 border-2 border-solar-600 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <div className="text-sm font-semibold text-slate-800">
            {uploading ? 'Uploading to Supabase Storage...' : 'Click to upload featured image'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG, WebP, or SVG up to 5MB
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
