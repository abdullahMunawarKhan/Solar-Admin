import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogForm } from '../components/forms/BlogForm';
import { createBlog } from '../services/blogs';
import { publishBlog } from '../services/publishing';

export function CreateBlog() {
  const navigate = useNavigate();

  const handleSaveDraft = async (formData) => {
    const created = await createBlog(formData);
    // Navigate to edit route for the created post
    navigate(`/blogs/edit/${created.id}`, { replace: true });
    return created;
  };

  const handlePublish = async (blogId) => {
    await publishBlog(blogId);
    navigate('/blogs');
  };

  return (
    <div className="py-2">
      <BlogForm
        onSubmit={handleSaveDraft}
        onPublish={handlePublish}
        isEdit={false}
      />
    </div>
  );
}
