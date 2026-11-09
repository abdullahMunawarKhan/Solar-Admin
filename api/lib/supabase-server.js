import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    const error = new Error('Missing server-side Supabase credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
    error.status = 500;
    throw error;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Validates the caller's JWT token and verifies they are an authorised admin
 * strictly via the public.admin_users database table.
 * 
 * Security rules:
 * - Rejects unauthenticated callers (missing/invalid JWT) with 401.
 * - Queries public.admin_users for user.id and verifies role === 'admin'.
 * - NEVER trusts client-editable user_metadata.
 * - Rejects non-admin users with 403.
 *
 * @param {string|null} authHeader 'Bearer <token>'
 * @returns {Promise<{ user: Object }>}
 */
export async function authenticateAdminRequest(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized: Missing or malformed Authorization header.');
    error.status = 401;
    throw error;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    const error = new Error('Unauthorized: Session token is empty.');
    error.status = 401;
    throw error;
  }

  const supabase = getSupabaseAdmin();

  // Validate JWT with Supabase Auth service
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    const error = new Error('Unauthorized: Invalid or expired session token.');
    error.status = 401;
    throw error;
  }

  // Authoritative check in public.admin_users table ONLY
  // User metadata (user_metadata) can be modified by the client and is NEVER trusted.
  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (adminError) {
    console.error('Database error verifying admin privileges:', adminError);
    const error = new Error('Authorization verification failed due to internal error.');
    error.status = 500;
    throw error;
  }

  if (!adminRecord || adminRecord.role !== 'admin') {
    const error = new Error('Forbidden: Your account does not have administrative publishing permissions.');
    error.status = 403;
    throw error;
  }

  return { user };
}
