// GET /api/auth/login — inicia el flujo OAuth: guarda un state CSRF y redirige
// al consentimiento de Google.
import crypto from 'node:crypto';
import { buildAuthUrl } from '../../lib/google.js';
import { serializeCookie, appendCookie, STATE_COOKIE } from '../../lib/cookies.js';

export default function handler(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(500).send('Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el servidor.');
    return;
  }
  const state = crypto.randomBytes(16).toString('base64url');
  appendCookie(
    res,
    serializeCookie(STATE_COOKIE, state, { maxAge: 600, sameSite: 'Lax' })
  );
  res.writeHead(302, { Location: buildAuthUrl(req, state) });
  res.end();
}
