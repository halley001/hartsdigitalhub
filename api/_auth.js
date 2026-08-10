// Shared helper for trainee endpoints: validates the sb_at cookie against
// Supabase and returns the authenticated user, or null.

import { parseCookies } from './_cookies.js';

export async function getSessionUser(req) {
  const { sb_at } = parseCookies(req);
  if (!sb_at) return null;

  const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${sb_at}`,
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
  if (!r.ok) return null;
  return r.json(); // { id, email, ... }
}
