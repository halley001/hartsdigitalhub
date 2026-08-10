// Minimal cookie helpers — no dependency, matches the zero-npm-deps convention
// used by the rest of api/ (see api/pay/_lib.js).

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

export function serializeCookie(name, value, { maxAge, path = '/', httpOnly = true, secure = true, sameSite = 'Lax' } = {}) {
  let str = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) str += '; HttpOnly';
  if (secure) str += '; Secure';
  if (maxAge != null) str += `; Max-Age=${maxAge}`;
  return str;
}
