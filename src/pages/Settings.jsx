import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Settings as SettingsIcon,
  Globe,
  GitBranch,
  Database,
  HardDrive,
  ShieldCheck,
  Copy,
  Check,
  Server,
  Cloud,
} from 'lucide-react';

export function Settings() {
  const { user, isAdmin, isSupabaseConfigured } = useAuth();
  const [copiedSql, setCopiedSql] = useState(false);

  const siteOrigin = import.meta.env.VITE_SITE_ORIGIN || 'https://www.proudindiansolar.com';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured';

  const adminSql = `-- Run this in Supabase SQL Editor to grant admin access to an email
INSERT INTO public.admin_users (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email = '${user?.email || 'admin@proudindiansolar.com'}'
ON CONFLICT (id) DO UPDATE SET role = 'admin';`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Publishing &amp; CMS Settings</h1>
        <p className="text-xs text-slate-500">
          Review environment parameters, target GitHub repositories, and administrator permissions
        </p>
      </div>

      {/* Hosting & Architecture Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Hosting &amp; Deployment Architecture</h3>
            <p className="text-xs text-slate-500">
              Verified multi-platform hosting configuration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Dashboard Deployment</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Netlify</span>
            </div>
            <div className="font-semibold text-slate-800">React 18 + Vite &amp; Netlify Functions v2</div>
            <p className="text-[11px] text-slate-500">Continuous deployment from Solar-Admin repo</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Main Website Deployment</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">Vercel</span>
            </div>
            <div className="font-semibold text-slate-800 truncate">abdullahMunawarKhan/Solar-Agency-</div>
            <p className="text-[11px] text-slate-500">Production domain: https://www.proudindiansolar.com</p>
          </div>
        </div>
      </div>

      {/* Target Website & Git Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Website &amp; Repository Target</h3>
            <p className="text-xs text-slate-500">
              Where generated static HTML pages and updated sitemaps are committed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">Public Site Origin</span>
            <div className="font-mono font-semibold text-slate-800 truncate">{siteOrigin}</div>
            <p className="text-[11px] text-slate-500">Used for canonical URLs &amp; JSON-LD structured data</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">Blog Output Directory</span>
            <div className="font-mono font-semibold text-slate-800">/blog/&lt;slug&gt;.html</div>
            <p className="text-[11px] text-slate-500">Destination folder inside the main website repository</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">Blogs Listing Page</span>
            <div className="font-mono font-semibold text-slate-800">blogs.html</div>
            <p className="text-[11px] text-slate-500">Updated automatically when publishing/unpublishing</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">Sitemap File</span>
            <div className="font-mono font-semibold text-slate-800">sitemap.xml</div>
            <p className="text-[11px] text-slate-500">Maintained with accurate &lt;lastmod&gt; timestamps</p>
          </div>
        </div>
      </div>

      {/* Supabase Storage & Database */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Supabase Infrastructure</h3>
            <p className="text-xs text-slate-500">Database storage, image CDN, and access controls</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Supabase Project</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              ></span>
            </div>
            <div className="font-mono font-semibold text-slate-800 truncate">{supabaseUrl}</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium">Storage Bucket</span>
            <div className="font-mono font-semibold text-slate-800">blog-images (Public)</div>
            <p className="text-[11px] text-slate-500">Max 5MB per upload (JPEG, PNG, WebP)</p>
          </div>
        </div>
      </div>

      {/* Admin Authorization SQL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Administrator Management</h3>
              <p className="text-xs text-slate-500">
                Granting administrator publishing permissions in Supabase
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(adminSql)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {adminSql}
          </pre>
        </div>
        <p className="text-xs text-slate-500">
          Admins must have a row in <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600 font-mono">public.admin_users</code>. Public anonymous users cannot view drafts or write to the database.
        </p>
      </div>
    </div>
  );
}
