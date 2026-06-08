// Helpers para hablar con los endpoints OAuth2 de Google (flujo authorization code).
// Usa fetch global (Node 18+ en Vercel). Sin dependencias externas.

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid',
].join(' ');

// Origen público de la app (para construir el redirect_uri). Prioriza APP_ORIGIN;
// si no, lo deriva de los headers de la request (útil en previews de Vercel).
export function getOrigin(req) {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export function getRedirectUri(req) {
  return `${getOrigin(req)}/api/auth/callback`;
}

// URL de consentimiento a la que redirigimos al usuario.
export function buildAuthUrl(req, state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(req),
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

// Intercambia el code por tokens. Devuelve el JSON de Google
// { access_token, refresh_token, expires_in, id_token, ... }.
export async function exchangeCode(req, code) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: getRedirectUri(req),
    grant_type: 'authorization_code',
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || 'token_exchange_failed');
    err.googleError = data.error;
    throw err;
  }
  return data;
}

// Usa un refresh token para obtener un access token nuevo.
// Devuelve { access_token, expires_in, ... }.
export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error_description || data.error || 'token_refresh_failed');
    err.googleError = data.error; // 'invalid_grant' => refresh revocado/expirado
    throw err;
  }
  return data;
}

// Revoca un token (best effort). No lanza si falla.
export async function revokeToken(token) {
  try {
    await fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    /* ignore */
  }
}

// Extrae el email del id_token (JWT) sin verificar firma (ya viene de un canal seguro).
export function emailFromIdToken(idToken) {
  try {
    const payload = idToken.split('.')[1];
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return json.email || null;
  } catch {
    return null;
  }
}
