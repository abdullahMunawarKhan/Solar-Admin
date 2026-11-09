import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { user, isAdmin, loading, isSupabaseConfigured, signOut, refreshAdminStatus } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-solar-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-600">Verifying administrator session...</p>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border border-slate-200">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Configuration Required</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Supabase environment variables are missing. Please configure your <code className="bg-slate-100 px-2 py-0.5 rounded text-pink-600 font-mono text-xs">.env</code> file with your Supabase URL and anon key to access the dashboard.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl text-left font-mono text-xs text-slate-700 border border-slate-200">
            <div>VITE_SUPABASE_URL=...</div>
            <div>VITE_SUPABASE_ANON_KEY=...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, but let's check admin authorization
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Signed in as <strong className="text-slate-800">{user.email}</strong>. This account has not been granted administrator permissions in <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">public.admin_users</code>.
          </p>
          <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 mb-6 text-left">
            <strong>How to authorize this account:</strong>
            <pre className="mt-2 text-[11px] overflow-x-auto p-2 bg-white rounded border border-amber-200">
INSERT INTO public.admin_users (id, email, role)
VALUES ('{user.id}', '{user.email}', 'admin');
            </pre>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => refreshAdminStatus()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
