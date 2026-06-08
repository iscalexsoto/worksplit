// Helpers mínimos de cookies para funciones serverless (sin dependencias).

// Parsea el header Cookie en un objeto { nombre: valor }.
export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

// Construye un header Set-Cookie. opts: { maxAge (s), httpOnly, secure, sameSite, path }.
export function serializeCookie(name, value, opts = {}) {
  const {
    maxAge,
    httpOnly = true,
    secure = true,
    sameSite = 'Lax',
    path = '/',
  } = opts;
  let str = `${name}=${encodeURIComponent(value)}`;
  str += `; Path=${path}`;
  str += `; SameSite=${sameSite}`;
  if (httpOnly) str += '; HttpOnly';
  if (secure) str += '; Secure';
  if (typeof maxAge === 'number') str += `; Max-Age=${maxAge}`;
  return str;
}

// Aplica uno o varios Set-Cookie sin pisar los previos.
export function appendCookie(res, cookieStr) {
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', cookieStr);
  else res.setHeader('Set-Cookie', [].concat(prev, cookieStr));
}

// Borra una cookie (Max-Age=0).
export function clearCookie(res, name, opts = {}) {
  appendCookie(res, serializeCookie(name, '', { ...opts, maxAge: 0 }));
}

export const SESSION_COOKIE = 'ws_session';
export const STATE_COOKIE = 'ws_oauth_state';
