import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Overview', subtitle: 'Solar blog performance, publishing status and quick actions' };
    if (path === '/blogs') return { title: 'All Blogs', subtitle: 'Manage drafts, edit existing articles, and trigger updates' };
    if (path === '/blogs/new') return { title: 'Add New Blog', subtitle: 'Compose a new SEO-friendly article' };
    if (path.startsWith('/blogs/edit/')) return { title: 'Edit Blog', subtitle: 'Update content, images, and SEO configuration' };
    if (path.startsWith('/blogs/preview/')) return { title: 'Blog Preview', subtitle: 'Live layout preview before publishing' };
    if (path === '/settings') return { title: 'Publishing Settings', subtitle: 'Website repository target and Supabase storage parameters' };
    return { title: 'Blog CMS', subtitle: '' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenMobile={() => setMobileOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
