import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Authoritative administrator verification.
   * Client-editable user_metadata is NEVER trusted.
   * Queries the public.admin_users table strictly.
   */
  const verifyAdminStatus = async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false);
      return false;
    }
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error verifying admin authorization in admin_users:', error);
        setIsAdmin(false);
        return false;
      }

      const authorized = Boolean(data && data.role === 'admin');
      setIsAdmin(authorized);
      return authorized;
    } catch (err) {
      console.error('Error verifying admin authorization:', err);
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error fetching session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await verifyAdminStatus(session.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await verifyAdminStatus(newSession.user);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials to the .env file.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    if (data?.user) {
      await verifyAdminStatus(data.user);
    }
    return data;
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
  };

  const resetPassword = async (email) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add your credentials to the .env file.');
    }
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    return data;
  };

  const updatePassword = async (newPassword) => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    return data;
  };

  const value = {
    user,
    session,
    isAdmin,
    loading,
    authError,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isSupabaseConfigured,
    refreshAdminStatus: () => user && verifyAdminStatus(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
