import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogForm } from '../components/forms/BlogForm';
import { fetchBlogById, updateBlog } from '../services/blogs';
import { publishBlog } from '../services/publishing';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchBlogById(id);
        setBlog(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdate = async (formData) => {
    const updated = await updateBlog(id, formData);
    setBlog(updated);
    return updated;
  };

  const handlePublish = async (blogId) => {
    await publishBlog(blogId);
    navigate('/blogs');
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-solar-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading blog article...</span>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-red-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Blog Not Found</h3>
        <p className="text-sm text-slate-600">{error || 'This article could not be loaded.'}</p>
        <button
          onClick={() => navigate('/blogs')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Blogs</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <BlogForm
        initialData={blog}
        onSubmit={handleUpdate}
        onPublish={handlePublish}
        isEdit={true}
      />
    </div>
  );
}
