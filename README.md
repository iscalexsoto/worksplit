# WorkSplit

Webapp para dividir y cronometrar trabajo (estilo LiveSplit), con guardado en
Google Sheets. Frontend estático (`public/index.html`, vanilla JS) + funciones
serverless de autenticación (`api/auth/*`) pensado para desplegarse en **Vercel**.

El login con Google usa el flujo OAuth **authorization code + refresh token**: te
conectas una vez y la sesión persiste durante días (el access token se renueva solo
por detrás), en lugar de expirar cada hora.

## Estructura

```
public/index.html   Frontend completo (HTML + CSS + JS)
api/auth/*.js        login / callback / token / logout (serverless)
lib/*.js             helpers OAuth, cifrado y cookies
legacy/              versión vieja en Go/.exe y Apps Script (ya no se usan)
```

## Configuración en Google Cloud Console

1. **Habilita las APIs**: Google Sheets API, Google Drive API y Google Picker API.
2. **OAuth Client ID** (tipo *Web application*):
   - *Authorized redirect URIs*:
     `http://localhost:3000/api/auth/callback` (dev) y
     `https://TU-APP.vercel.app/api/auth/callback` (producción).
   - *Authorized JavaScript origins*: `http://localhost:3000` y `https://TU-APP.vercel.app`
     (necesario para el Picker).
3. Copia el **Client ID** y el **Client Secret**.
4. **API key** (para el Picker): créala en *Credenciales*.
5. **Pantalla de consentimiento → publica en "Producción"** (no "Testing").
   En Testing los refresh tokens caducan a los 7 días. Con los scopes usados
   (`drive.file`, `userinfo.email`, `openid`, NO sensibles) publicar a Producción
   **no requiere verificación de Google**.

## Variables de entorno

Copia `.env.example` a `.env.local` (dev) y carga las mismas variables en Vercel:

| Variable | Descripción |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Client Secret (¡solo servidor!) |
| `COOKIE_SECRET` | Clave para cifrar la cookie. Genérala: `openssl rand -base64 32` |
| `APP_ORIGIN` | `http://localhost:3000` en dev; tu dominio en prod (opcional) |

Además, pon tu **API key** del Picker en `public/index.html` (`GOOGLE_API_KEY`); es
una credencial pública.

## Desarrollo local

```bash
npm i -g vercel      # una vez
vercel dev           # sirve public/ + /api en http://localhost:3000
```

## Despliegue

```bash
vercel               # primer deploy / previews
vercel --prod        # producción
```

Carga las variables de entorno en **Vercel → Settings → Environment Variables**
antes del primer deploy de producción.

## Verificación rápida

1. Abre la app → "Conectar con Google" → consiente → vuelves conectado.
2. **Recarga la página**: debes seguir conectado (esa es la mejora clave).
3. Elige carpeta, crea el Sheet, deja que autoguarde y prueba "Cargar".
4. "Salir" cierra la sesión.
