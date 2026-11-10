import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
  SunMedium,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'All Blogs', to: '/blogs', icon: FileText },
    { label: 'Add New Blog', to: '/blogs/new', icon: PlusCircle },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const isItemActive = (item) => {
    const pathname = location.pathname;
    if (item.to === '/') {
      return pathname === '/';
    }
    if (item.to === '/blogs/new') {
      return pathname === '/blogs/new';
    }
    if (item.to === '/blogs') {
      return (
        pathname === '/blogs' ||
        pathname.startsWith('/blogs/edit') ||
        pathname.startsWith('/blogs/preview')
      );
    }
    if (item.to === '/settings') {
      return pathname === '/settings';
    }
    return pathname === item.to;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-solar-500 text-slate-950 font-bold">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide uppercase">Solar CMS</h1>
              <span className="text-[10px] text-solar-400 font-medium">Blog Dashboard</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-solar-500 text-slate-950 font-semibold shadow-sm'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Live Site Preview Link */}
        <div className="px-4 py-3 mx-4 mb-4 rounded-xl bg-slate-800/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Target Site</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-xs font-mono text-slate-300 truncate mb-2">
            {import.meta.env.VITE_SITE_ORIGIN || 'https://www.example.com'}
          </p>
          <a
            href={import.meta.env.VITE_SITE_ORIGIN || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-solar-400 hover:text-solar-300 font-medium transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-solar-500/20 text-solar-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.email?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{user?.email || 'Admin'}</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isAdmin ? 'Authorized Admin' : 'Admin'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
