import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogStats, fetchBlogs } from '../services/blogs';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDate, formatRelativeTime } from '../utils/date';
import {
  FileText,
  CheckCircle2,
  Clock,
  Archive,
  Plus,
  ArrowRight,
  GitCommit,
  Globe,
  Database,
  ExternalLink,
  RefreshCw,
  Server,
} from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, archived: 0 });
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, blogsData] = await Promise.all([
        fetchBlogStats(),
        fetchBlogs({ sortBy: 'updated_at', sortOrder: 'desc' }),
      ]);
      setStats(statsData);
      setRecentBlogs(blogsData.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      label: 'Total Blogs',
      count: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Published Live',
      count: stats.published,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Drafts',
      count: stats.draft,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Archived',
      count: stats.archived,
      icon: Archive,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-solar-500/20 text-solar-400 border border-solar-500/30 rounded-full text-xs font-semibold mb-3">
            Solar CMS — Proud Indian Solar
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 font-sans">
            Solar Blog Content Management
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Create, preview, and securely publish static SEO-ready blog posts to the live Proud Indian Solar website (hosted on Vercel) via atomic Git commits and Netlify Functions v2.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/blogs/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-solar-500 hover:bg-solar-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Article</span>
            </Link>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              <span>Manage All Blogs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {loading ? '—' : stat.count}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment & Integration Architecture Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Publishing Pipeline Status</h3>
            <p className="text-xs text-slate-500">Live components powering automated static site generation</p>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase Database</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-500">PostgreSQL with hardened RLS &amp; admin policies</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-solar-600" />
                <span>Netlify Functions v2</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-500">Serverless dashboard hosting &amp; API publishing endpoints</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-blue-600" />
                <span>GitHub Repository</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-500">Atomic commits to <code className="bg-white px-1 py-0.5 rounded text-[11px] font-mono">abdullahMunawarKhan/Solar-Agency-</code></p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-600" />
                <span>Vercel Live Deployment</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-500">Main website continuous deployment at <code className="bg-white px-1 py-0.5 rounded text-[11px] font-mono">proudindiansolar.com</code></p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recently Updated Articles</h3>
            <p className="text-xs text-slate-500">Quickly resume writing or review recent changes</p>
          </div>
          <Link
            to="/blogs"
            className="text-xs font-semibold text-solar-600 hover:text-solar-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {recentBlogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No blog posts yet. Click <Link to="/blogs/new" className="text-solar-600 font-semibold hover:underline">Create New Article</Link> to write your first post.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Article</th>
                  <th className="px-6 py-3.5 font-semibold">Category</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Last Updated</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {blog.featured_image ? (
                          <img
                            src={blog.featured_image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/blogs/edit/${blog.id}`}
                            className="font-bold text-slate-900 hover:text-solar-600 transition-colors truncate block max-w-sm"
                          >
                            {blog.title}
                          </Link>
                          <span className="text-xs font-mono text-slate-400 truncate block">
                            /blog/{blog.slug}.html
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {blog.category || 'General'}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={blog.status} />
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatRelativeTime(blog.updated_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/blogs/preview/${blog.id}`}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          Preview
                        </Link>
                        <Link
                          to={`/blogs/edit/${blog.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-solar-700 bg-solar-50 hover:bg-solar-100 rounded-md transition-colors"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
