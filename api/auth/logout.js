// Vercel Serverless Function — POST /api/auth/logout
// Clears the session cookies. The client redirects to /login.html after.

import { serializeCookie } from '../_cookies.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  res.setHeader('Set-Cookie', [
    serializeCookie('sb_at', '', { maxAge: 0 }),
    serializeCookie('sb_rt', '', { maxAge: 0 })
  ]);
  return res.status(200).json({ ok: true });
}
