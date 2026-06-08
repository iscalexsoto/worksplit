// GET /api/config — config pública para el frontend.
// La API key del Picker es una credencial pública (visible en el navegador);
// se sirve desde aquí solo para no tenerla hardcodeada en el repo. Su protección
// real son las restricciones de dominio configuradas en Google Cloud.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json({
    googleApiKey: process.env.GOOGLE_API_KEY || null,
  });
}
