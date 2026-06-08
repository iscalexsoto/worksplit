// Cifrado simétrico para guardar el refresh token dentro de una cookie.
// AES-256-GCM con clave derivada de COOKIE_SECRET. Sin dependencias externas.
import crypto from 'node:crypto';

function getKey() {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) throw new Error('Falta COOKIE_SECRET');
  // Derivamos 32 bytes deterministas desde el secreto (acepta cualquier longitud).
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

// Devuelve un string "ivBase64.tagBase64.cipherBase64" (url-safe-ish, sin '=').
export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64url')).join('.');
}

// Devuelve el texto plano, o null si el token está corrupto / la clave no coincide.
export function decrypt(payload) {
  try {
    const key = getKey();
    const [ivB64, tagB64, dataB64] = String(payload).split('.');
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const iv = Buffer.from(ivB64, 'base64url');
    const tag = Buffer.from(tagB64, 'base64url');
    const data = Buffer.from(dataB64, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return null;
  }
}
