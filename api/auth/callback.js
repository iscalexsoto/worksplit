// GET /api/auth/callback — Google vuelve aquí con ?code&state.
// Intercambia el code por tokens, cifra el refresh token en una cookie httpOnly
// y redirige a la app.
import { exchangeCode, emailFromIdToken, getOrigin } from '../../lib/google.js';
import { encrypt } from '../../lib/crypto.js';
import {
  parseCookies,
  serializeCookie,
  appendCookie,
  clearCookie,
  SESSION_COOKIE,
  STATE_COOKIE,
} from '../../lib/cookies.js';

// 60 días: la cookie vive largo; el refresh token de Google (en proyecto en
// Producción) también, así la sesión persiste sin re-login.
const SESSION_MAX_AGE = 60 * 24 * 60 * 60;

export default async function handler(req, res) {
  const origin = getOrigin(req);
  try {
    const { code, state, error } = req.query;
    if (error) return redirect(res, origin, 'error=' + encodeURIComponent(error));
    if (!code) return redirect(res, origin, 'error=missing_code');

    const cookies = parseCookies(req);
    if (!state || !cookies[STATE_COOKIE] || state !== cookies[STATE_COOKIE]) {
      return redirect(res, origin, 'error=state_mismatch');
    }
    clearCookie(res, STATE_COOKIE);

    const tokens = await exchangeCode(req, code);
    if (!tokens.refresh_token) {
      // Google no devolvió refresh token (suele pasar si ya se concedió antes sin
      // prompt=consent). login.js fuerza prompt=consent, así que esto es raro.
      return redirect(res, origin, 'error=no_refresh_token');
    }

    const email = emailFromIdToken(tokens.id_token);
    const sessionPayload = JSON.stringify({ rt: tokens.refresh_token, email });
    appendCookie(
      res,
      serializeCookie(SESSION_COOKIE, encrypt(sessionPayload), {
        maxAge: SESSION_MAX_AGE,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      })
    );
    return redirect(res, origin, 'connected=1');
  } catch (e) {
    return redirect(res, origin, 'error=' + encodeURIComponent(e.message || 'auth_failed'));
  }
}

function redirect(res, origin, query) {
  res.writeHead(302, { Location: `${origin}/?${query}` });
  res.end();
}
