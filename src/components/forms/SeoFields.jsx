import React from 'react';
import { Search, Globe, HelpCircle } from 'lucide-react';

export function SeoFields({
  title,
  slug,
  metaTitle,
  metaDescription,
  canonicalUrl,
  onChange,
}) {
  const defaultOrigin = (import.meta.env.VITE_SITE_ORIGIN || 'https://www.example.com').replace(/\/$/, '');
  const previewUrl = canonicalUrl || `${defaultOrigin}/blog/${slug || 'your-blog-slug'}.html`;
  const displayTitle = metaTitle || (title ? `${title} | Blog` : 'Blog Title Preview');
  const displayDesc = metaDescription || 'Add an SEO description to see how this solar article will appear in Google search results.';

  const titleLength = (metaTitle || '').length;
  const descLength = (metaDescription || '').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">SEO &amp; Metadata</h3>
          <p className="text-xs text-slate-500">
            Optimize for search engines, social shares, and clear canonical ranking
          </p>
        </div>
      </div>

      {/* Google SERP Preview Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Search className="w-3.5 h-3.5" />
          <span>Google Search Result Preview</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg font-sans">
          <div className="text-xs text-slate-600 truncate flex items-center gap-1 mb-1">
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="truncate">{previewUrl}</span>
          </div>
          <div className="text-base text-blue-800 font-medium hover:underline cursor-pointer truncate">
            {displayTitle}
          </div>
          <div className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
            {displayDesc}
          </div>
        </div>
      </div>

      {/* Meta Title Field */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            Meta Title
          </label>
          <span
            className={`text-[11px] font-mono ${
              titleLength > 60
                ? 'text-red-500 font-bold'
                : titleLength >= 40
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {titleLength}/60 characters {titleLength > 60 && '(Too long)'}
          </span>
        </div>
        <input
          type="text"
          placeholder={title ? `${title} | Solar Solutions` : 'Enter meta title'}
          value={metaTitle || ''}
          onChange={(e) => onChange('meta_title', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Recommended length: 50–60 characters. Leave blank to inherit blog title.
        </p>
      </div>

      {/* Meta Description Field */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700">
            Meta Description
          </label>
          <span
            className={`text-[11px] font-mono ${
              descLength > 160
                ? 'text-red-500 font-bold'
                : descLength >= 120
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-400'
            }`}
          >
            {descLength}/160 characters {descLength > 160 && '(Too long)'}
          </span>
        </div>
        <textarea
          rows={3}
          placeholder="Enter a compelling summary for search results..."
          value={metaDescription || ''}
          onChange={(e) => onChange('meta_description', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Recommended length: 120–160 characters.
        </p>
      </div>

      {/* Custom Canonical URL */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            <span>Canonical URL Override</span>
            <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          </label>
        </div>
        <input
          type="url"
          placeholder={previewUrl}
          value={canonicalUrl || ''}
          onChange={(e) => onChange('canonical_url', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 font-mono text-xs"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Defaults to <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{previewUrl}</code>. Only override if syndicated from an external source.
        </p>
      </div>
    </div>
  );
}
