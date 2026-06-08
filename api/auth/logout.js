// POST /api/auth/logout — revoca el refresh token (best effort) y borra la cookie.
import { refreshAccessToken, revokeToken } from '../../lib/google.js';
import { decrypt } from '../../lib/crypto.js';
import { parseCookies, clearCookie, SESSION_COOKIE } from '../../lib/cookies.js';

export default async function handler(req, res) {
  const cookies = parseCookies(req);
  const raw = cookies[SESSION_COOKIE];
  if (raw) {
    const decrypted = decrypt(raw);
    try {
      const session = decrypted ? JSON.parse(decrypted) : null;
      if (session?.rt) {
        // Revocar el access token derivado revoca también la concesión.
        const data = await refreshAccessToken(session.rt).catch(() => null);
        await revokeToken(data?.access_token || session.rt);
      }
    } catch {
      /* ignore */
    }
  }
  clearCookie(res, SESSION_COOKIE);
  res.status(200).json({ ok: true });
}
