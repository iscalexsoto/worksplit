# WorkSplit

Webapp para dividir y cronometrar trabajo (estilo LiveSplit), con guardado en
Google Sheets. Frontend estático (`public/index.html`, vanilla JS) + funciones
serverless de autenticación (`api/auth/*`) pensado para desplegarse en **Vercel**.

El login con Google usa el flujo OAuth **authorization code + refresh token**: te
conectas una vez y la sesión persiste durante días (el access token se renueva solo
por detrás), en lugar de expirar cada hora.

Es además una **PWA instalable**: desde Chrome/Edge aparece el botón "Instalar" y se
abre en su propia ventana, con ícono propio y auto-actualización.

Puedes manejar **varias "Runs"** (historias de usuario, al estilo Scrum para un solo
dev): preparas varias listas independientes y **alternas entre ellas** cuando te atoras
o cambia la prioridad. Cada Run lleva su propio cronometraje; el backlog es compartido.

## ¿Qué puedo hacer en esta aplicación?

### Trabajar con varias historias de usuario (Runs)
- **Crear varias Runs**, cada una con su propio título, descripción, lista de tareas y cronometraje (total, ausente y por tarea).
- **Alternar entre Runs** desde la barra de pestañas: al cambiar, la Run en curso se pausa y la otra retoma su propio tiempo (solo una corre a la vez).
- **Renombrar una Run** editando su título, o **eliminarla** (sus tareas se quitan; el backlog global no se toca).
- **Compartir un backlog global** entre todas las Runs: una tarea del backlog puede entrar a cualquier Run.

### Organizar tu trabajo antes de empezar
- **Crear una lista de tareas** con un nombre y un tiempo estimado en minutos para cada una.
- **Ponerle un título y una descripción a cada Run** para identificar el proyecto o la historia de usuario.
- **Agrupar las tareas por categorías** y crear, renombrar o eliminar esos grupos (los grupos son globales, compartidos entre Runs).
- **Reordenar tareas y grupos arrastrándolos**, e incluso mover una tarea de un grupo a otro.
- **Editar el nombre o el tiempo estimado** de una tarea directamente en la lista.
- **Eliminar tareas** sueltas o **limpiar toda la lista** de la Run de una vez.

### Cronometrar tu sesión de trabajo
- **Iniciar una sesión** y empezar a cronometrar la tarea en curso.
- **Ver tres relojes a la vez**: tiempo de la tarea actual, tiempo total de la sesión y tiempo total ausente.
- **Marcar tareas como terminadas**, registrando cuánto tiempo real tomó cada una.
- **Cambiar a otra tarea en medio de la sesión**, guardando el tiempo acumulado para retomarla donde la dejaste.
- **Marcarte como ausente y volver** (también con la barra espaciadora).
- **Detener y reanudar** la sesión cuando quieras.
- **Restablecer** la Run activa para empezar de cero (sin afectar las demás).
- **Recuperar tu trabajo al recargar la página**: todas tus Runs se guardan automáticamente en tu navegador.

### Comparar lo estimado contra lo real
- **Ver en tiempo real tus desvíos**, con colores: verde si vas por debajo de lo estimado, rojo si te pasaste.
- **Consultar un resumen de la sesión**: total estimado, tiempo real, tiempo ausente y diferencia general.
- **Ver un resumen final al terminar** todas las tareas.

### Manejar imprevistos durante la sesión
- **Agregar tareas nuevas mientras la sesión está en marcha**, que entran a una lista de pendientes (backlog).
- **Mantener un backlog de tareas** fuera de la sesión, como reserva de cosas por hacer.
- **Pasar tareas del backlog a la sesión** o sacarlas de la sesión hacia el backlog.
- **Interrumpir una tarea a medias**: se cierra con el tiempo que llevabas y puedes crear una continuación para seguirla ahora o en otra sesión.

### Avisos y acompañamiento
- **Notificación breve al terminar una tarea**, con duración configurable.
- **Pausa opcional entre tareas** (un respiro antes del siguiente bloque), con duración ajustable.
- **Elegir manualmente tu siguiente tarea** o retomar una anterior, en lugar de avanzar automáticamente.
- **Aviso de "¿estás atorado?"** cuando una tarea supera su estimado por encima de cierto margen, con opción de continuar o entrar en una pausa indefinida.

### Guardar e historial en Google Sheets
- **Conectar tu cuenta de Google** para respaldar tu trabajo.
- **Guardar todas tus Runs en una hoja de cálculo** (la app crea o reutiliza una hoja propia en tu Drive): una fila por Run, sus tareas y el backlog global.
- **Obtener un resumen legible por Run**, en su propia pestaña dentro de la hoja.
- **Exportar el resumen de una Run a su propia hoja de cálculo** aparte, nombrada con su título (se reutiliza el archivo si ya existe).
- **Cargar tus Runs guardadas** previamente.
- **Mantener un historial** que registra cada sesión que cierras (terminada o restablecida), con el título de la Run.
- **Guardado automático periódico** mientras trabajas.
- **Abrir tu hoja de cálculo** directamente desde la app, o **desconectar** tu cuenta.

### Preferencias y comodidad
- **Activar o desactivar cada aviso** y ajustar sus tiempos.
- **Decidir qué pasa al restablecer una sesión sin terminar**: preguntar cada vez, guardar siempre o nunca.
- **Mantener visible el formulario de agregar tareas** durante una sesión activa, si lo prefieres.
- **Cambiar el idioma** entre español e inglés.
- **Usar la app en el celular**, con un diseño de pestañas (Sesión, Resumen y Ajustes).
- **Instalar la aplicación** como app en tu dispositivo (PWA).

## Estructura

```
public/index.html         Frontend completo (HTML + CSS + JS)
public/manifest.webmanifest  Manifiesto PWA (nombre, íconos, colores)
public/sw.js              Service worker (instalable + carga offline)
public/icons/             Íconos de la app
api/auth/*.js             login / callback / token / logout (serverless)
lib/*.js                  helpers OAuth, cifrado y cookies
legacy/                   versión vieja en Go/.exe y Apps Script (ya no se usan)
```

El Sheet se crea (o se reutiliza si ya existe) dentro de una carpeta `WorkSplit` en
"Mi unidad" del usuario. No usa el Google Picker ni API key: todo va con el access
token vía las APIs REST de Drive/Sheets.

## Configuración en Google Cloud Console

1. **Habilita las APIs**: Google Sheets API y Google Drive API.
2. **OAuth Client ID** (tipo *Web application*):
   - *Authorized redirect URIs*:
     `http://localhost:3000/api/auth/callback` (dev) y
     `https://TU-APP.vercel.app/api/auth/callback` (producción).
   - *Authorized JavaScript origins*: `http://localhost:3000` y `https://TU-APP.vercel.app`.
3. Copia el **Client ID** y el **Client Secret**.
4. **Pantalla de consentimiento → publica en "Producción"** (no "Testing").
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

1. Abre la app → "Conectar con Google" → consiente → vuelves conectado y se crea
   (o reutiliza) la carpeta `WorkSplit` con tu Sheet dentro.
2. **Recarga la página**: debes seguir conectado (esa es la mejora clave).
3. Deja que autoguarde y prueba "Cargar".
4. "Salir" cierra la sesión.
