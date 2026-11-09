import React from 'react';
import { Menu, Plus, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Header({ onOpenMobile, title, subtitle }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">{title || 'Dashboard'}</h2>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/blogs/new"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-solar-500 hover:bg-solar-600 text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Blog</span>
        </Link>
      </div>
    </header>
  );
}
