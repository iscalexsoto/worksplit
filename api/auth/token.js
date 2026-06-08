// GET /api/auth/token — devuelve un access token fresco usando el refresh token
// cifrado en la cookie de sesión. Es lo que el cliente llama en vez de GIS.
import { refreshAccessToken } from '../../lib/google.js';
import { decrypt } from '../../lib/crypto.js';
import { parseCookies, clearCookie, SESSION_COOKIE } from '../../lib/cookies.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) {
    res.status(401).json({ error: 'not_connected' });
    return;
  }

  const decrypted = decrypt(raw);
  let session = null;
  try {
    session = decrypted ? JSON.parse(decrypted) : null;
  } catch {
    session = null;
  }
  if (!session?.rt) {
    clearCookie(res, SESSION_COOKIE);
    res.status(401).json({ error: 'invalid_session' });
    return;
  }

  try {
    const data = await refreshAccessToken(session.rt);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      email: session.email || null,
    });
  } catch (e) {
    // Refresh revocado/expirado → limpiar sesión para que el cliente reconecte.
    if (e.googleError === 'invalid_grant') clearCookie(res, SESSION_COOKIE);
    res.status(401).json({ error: e.googleError || 'refresh_failed' });
  }
}
