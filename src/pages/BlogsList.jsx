import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBlogs, deleteBlog } from '../services/blogs';
import { publishBlog, unpublishBlog } from '../services/publishing';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { formatDate, formatRelativeTime } from '../utils/date';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  Send,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  FileText,
  CheckCircle2,
} from 'lucide-react';

export function BlogsList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [deleteModal, setDeleteModal] = useState({ open: false, blog: null, loading: false });
  const [publishModal, setPublishModal] = useState({ open: false, blog: null, loading: false, isUnpublish: false });
  const [actionNotice, setActionNotice] = useState(null);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await fetchBlogs({
        search,
        status: statusFilter,
        category: categoryFilter,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setBlogs(data);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBlogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, categoryFilter]);

  const handleDeleteConfirm = async () => {
    if (!deleteModal.blog) return;
    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await deleteBlog(deleteModal.blog.id);
      setActionNotice({ type: 'success', message: `Blog "${deleteModal.blog.title}" deleted.` });
      setDeleteModal({ open: false, blog: null, loading: false });
      await loadBlogs();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message });
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handlePublishConfirm = async () => {
    const blog = publishModal.blog;
    if (!blog) return;

    try {
      setPublishModal((prev) => ({ ...prev, loading: true }));
      if (publishModal.isUnpublish) {
        await unpublishBlog(blog.id);
        setActionNotice({ type: 'success', message: `Blog "${blog.title}" unpublished and reverted to draft.` });
      } else {
        await publishBlog(blog.id);
        setActionNotice({ type: 'success', message: `Blog "${blog.title}" published and committed to site repository!` });
      }
      setPublishModal({ open: false, blog: null, loading: false, isUnpublish: false });
      await loadBlogs();
    } catch (err) {
      setActionNotice({ type: 'error', message: err.message });
      setPublishModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manage All Blogs</h1>
          <p className="text-xs text-slate-500">
            Search, filter, update drafts, and deploy static articles
          </p>
        </div>

        <Link
          to="/blogs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-solar-500 hover:bg-solar-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Blog Article</span>
        </Link>
      </div>

      {actionNotice && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, URL slug, or excerpt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Drafts Only</option>
              <option value="published">Published Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>

          <div className="relative w-full md:w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar-500 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Solar Energy">Solar Energy</option>
              <option value="Maintenance & Care">Maintenance &amp; Care</option>
              <option value="Commercial Solar">Commercial Solar</option>
              <option value="Residential Solar">Residential Solar</option>
              <option value="Government Schemes">Government Schemes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blogs Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-3 border-solar-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <span>Loading articles...</span>
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">No blog posts found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Article &amp; Slug</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Dates</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        {blog.featured_image ? (
                          <img
                            src={blog.featured_image}
                            alt=""
                            className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-md">
                          <Link
                            to={`/blogs/edit/${blog.id}`}
                            className="font-bold text-slate-900 hover:text-solar-600 transition-colors truncate block"
                          >
                            {blog.title}
                          </Link>
                          <div className="text-xs font-mono text-slate-400 truncate">
                            /blog/{blog.slug}.html
                          </div>
                          {blog.excerpt && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {blog.excerpt}
                            </p>
                          )}
                          {blog.last_publish_error && (
                            <div className="mt-1 text-[11px] text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">Publish Error: {blog.last_publish_error}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={blog.status} />
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">
                        {blog.category || 'General'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 space-y-0.5">
                      <div>
                        <span className="text-slate-400">Created:</span> {formatDate(blog.created_at)}
                      </div>
                      {blog.published_at && (
                        <div>
                          <span className="text-emerald-600 font-medium">Published:</span>{' '}
                          {formatDate(blog.published_at)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/blogs/preview/${blog.id}`}
                          title="Preview Layout"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <Link
                          to={`/blogs/edit/${blog.id}`}
                          title="Edit Article"
                          className="p-1.5 text-slate-500 hover:text-solar-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {blog.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPublishModal({
                                open: true,
                                blog,
                                loading: false,
                                isUnpublish: true,
                              })
                            }
                            title="Unpublish (Revert to Draft)"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPublishModal({
                                open: true,
                                blog,
                                loading: false,
                                isUnpublish: false,
                              })
                            }
                            title="Publish Live"
                            className="p-1.5 text-solar-600 hover:bg-solar-50 rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, blog, loading: false })}
                          title="Delete Blog"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Blog Post?"
        message={`Are you sure you want to permanently delete "${deleteModal.blog?.title}"? This will remove the record from Supabase.`}
        confirmText="Delete Blog"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteModal.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, blog: null, loading: false })}
      />

      {/* Publish/Unpublish Confirmation Modal */}
      <ConfirmModal
        isOpen={publishModal.open}
        title={publishModal.isUnpublish ? 'Unpublish Blog Post?' : 'Publish Blog to Live Site?'}
        message={
          publishModal.isUnpublish
            ? `Unpublishing "${publishModal.blog?.title}" will remove it from sitemap.xml and blogs.html, and commit the changes to your GitHub repository.`
            : `Publishing "${publishModal.blog?.title}" will generate the static HTML page, update sitemap.xml & blogs.html, and trigger Netlify continuous deployment.`
        }
        confirmText={publishModal.isUnpublish ? 'Confirm Unpublish' : 'Confirm Publish'}
        cancelText="Cancel"
        isLoading={publishModal.loading}
        onConfirm={handlePublishConfirm}
        onCancel={() => setPublishModal({ open: false, blog: null, loading: false, isUnpublish: false })}
      />
    </div>
  );
}
