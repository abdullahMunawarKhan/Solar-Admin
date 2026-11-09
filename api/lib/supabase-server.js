import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing server-side Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Validates the caller's JWT token and verifies they are an authorised admin.
 * @param {string} authHeader 'Bearer <token>'
 * @returns {Promise<{ user: Object }>}
 */
export async function authenticateAdminRequest(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header.');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const supabase = getSupabaseAdmin();

  // Validate JWT
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Unauthorized: Invalid or expired session token.');
  }

  // Check admin authorization in public.admin_users
  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isMetadataAdmin = user.app_metadata?.role === 'admin';
  const isAuthorized = (adminRecord && adminRecord.role === 'admin') || isMetadataAdmin;

  if (!isAuthorized) {
    throw new Error('Forbidden: Your account does not have administrative publishing permissions.');
  }

  return { user };
}
