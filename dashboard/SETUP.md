# Conectar las APIs del WRS Growth Dashboard

Orden recomendado: lo que más tarda primero. Ninguna clave se pega en chats ni en el repo: todas van directo a Vercel → Project → Settings → Environment Variables.

| # | Paso | Quién | Tiempo |
|---|---|---|---|
| 1 | Pedir acceso a la API de Business Profile | Dueño/administrador del perfil de Google de WRS | 10 min + espera de días |
| 2 | Proyecto en Vercel, Blob, cron y contraseña | DXW | 20 min |
| 3 | Proyecto de Google Cloud y cuenta de servicio | DXW | 15 min |
| 4 | GA4 | Admin de la propiedad GA4 de WRS | 5 min |
| 5 | Search Console | Propietario de la propiedad en Search Console | 5 min |
| 6 | Reseñas (Places) | DXW (copiar del sitio) | 5 min |
| 7 | JobNimbus | Admin de JobNimbus de WRS | 5 min |
| 8 | PageSpeed y GTM | DXW | 5 min |
| 9 | Business Profile (cuando Google apruebe) | DXW + cuenta que administra el perfil | 20 min |
| 10 | Línea base y verificación | DXW | 15 min |

---

## 1. Pedir acceso a la API de Business Profile (hoy)

Google no da acceso por defecto; sin aprobación todas las llamadas responden con cuota 0.

1. Primero haz el paso 3.1 (crear el proyecto de Google Cloud) y copia su **Project number** (Cloud Console → panel del proyecto).
2. Abre https://developers.google.com/my-business/content/prereqs y entra al formulario de solicitud de acceso ("GBP API contact form" → "Application for Basic API Access").
3. Llénalo con un correo que sea **administrador del perfil de WRS**, el project number y el sitio web de WRS. El perfil debe estar verificado y activo.
4. Espera el correo de aprobación. Para confirmarlo: Cloud Console → APIs & Services → "My Business Account Management API" → Quotas. Si la cuota por minuto es mayor que 0, ya está aprobado.

## 2. Vercel: proyecto, Blob, cron y contraseña

Hazlo pronto: el historial de reseñas y velocidad solo empieza a contar desde la primera foto diaria.

1. Vercel → Add New → Project → importa `charls84/WRS_WEB`.
2. **Root Directory**: `dashboard`. Framework: Next.js.
3. Settings → Git → **Production Branch**: `wrs-dashboard-web` (o `master` cuando se fusione). Los cron jobs de Vercel solo corren en producción.
4. Storage → Create → **Blob** → conéctalo al proyecto. Esto crea `BLOB_READ_WRITE_TOKEN` solo.
5. Variables de entorno (Production):
   - `DASHBOARD_PASSWORD`: una contraseña fuerte. Sin ella la página no abre en producción.
   - `DASHBOARD_USER`: `wrs` (o el que prefieras).
   - `CRON_SECRET`: genera uno con `openssl rand -hex 32`.
   - `WRS_SITE_URL`: el dominio en vivo del sitio. Hoy el código asume `https://weatherrecoverysolutions.com`; si el sitio todavía vive en `https://weather-recovery-solutions.vercel.app`, pon ese.
6. Deploy. El cron (`vercel.json`) llama a `/api/cron/snapshot` todos los días a las 07:00 UTC.

## 3. Google Cloud: proyecto y cuenta de servicio (GA4 + Search Console)

1. https://console.cloud.google.com → New Project → `wrs-dashboard`.
2. APIs & Services → Library → habilita:
   - Google Analytics Data API
   - Google Search Console API
   - PageSpeed Insights API
3. IAM & Admin → Service Accounts → Create service account → nombre `wrs-dashboard`. No le asignes roles del proyecto.
4. Abre la cuenta → Keys → Add key → Create new key → **JSON**. Se descarga un archivo.
   - Si sale "Service account key creation is disabled", la organización de Google Cloud tiene esa política activa; usa un proyecto fuera de esa organización o pide a su admin una excepción.
5. Copia el correo de la cuenta (`wrs-dashboard@<proyecto>.iam.gserviceaccount.com`). Lo usas en los pasos 4 y 5.
6. Convierte el JSON a base64 y pégalo en Vercel como `GOOGLE_SERVICE_ACCOUNT_JSON`:
   - Mac: `base64 -i clave.json | pbcopy`
   - Linux: `base64 -w0 clave.json`
7. Borra el archivo JSON de tu computador después de pegarlo.

## 4. GA4

1. GA4 → Admin (engranaje) → Property → **Property access management** → `+` → Add users.
2. Pega el correo de la cuenta de servicio, rol **Viewer**, sin notificar por correo.
3. Admin → Property details → copia el **Property ID** (solo números) → Vercel `GA4_PROPERTY_ID`.
4. Revisa que en GA4 existan los eventos `generate_lead`, `phone_click` y `map_click` (Reports → Engagement → Events). Son los que el sitio envía por GTM; si GTM no los reenvía a GA4, el dashboard los mostrará en 0.

## 5. Search Console

1. Search Console → la propiedad de WRS → Settings → **Users and permissions** → Add user.
2. Correo de la cuenta de servicio, permiso **Full** (lo necesita la API de inspección de URLs para revisar indexación; no puede borrar ni cambiar dueños).
3. `GSC_SITE_URL` en Vercel, exactamente como aparece la propiedad:
   - Propiedad de dominio: `sc-domain:weatherrecoverysolutions.com`
   - Propiedad de prefijo de URL: `https://weatherrecoverysolutions.com/` (con la barra final)

## 6. Reseñas de Google (Places)

El sitio ya usa estas dos variables en `/api/reviews/refresh`.

1. Vercel → proyecto del sitio WRS → Settings → Environment Variables → copia `GOOGLE_PLACES_API_KEY` y `GOOGLE_PLACES_ID`.
2. Pégalas igual en el proyecto del dashboard.
3. Si la clave tiene restricción por referrer HTTP, no funcionará desde el servidor: en Cloud Console déjala restringida por API (Places API) en vez de por referrer.

## 7. JobNimbus

1. JobNimbus → Settings → **API** → New API Key → nombre `DOUX dashboard`.
2. Si JobNimbus te deja asignarle un perfil de acceso limitado, elige el más restringido que pueda leer contactos y trabajos.
3. Vercel → `JOBNIMBUS_API_KEY`.
4. Usa una clave distinta a la del formulario del sitio, para poder revocarla sin romper la captura de leads.

## 8. PageSpeed y GTM

1. Cloud Console (mismo proyecto) → APIs & Services → Credentials → Create credentials → **API key**.
2. Edit → API restrictions → Restrict key → solo **PageSpeed Insights API**.
3. Vercel → `PAGESPEED_API_KEY`. Sin clave, la cuota gratuita compartida se agota y la medición falla.
4. Vercel → `GTM_ID`: el mismo valor que `NEXT_PUBLIC_GTM_ID` del sitio (formato `GTM-XXXXXXX`).

## 9. Business Profile (después de la aprobación del paso 1)

Business Profile no acepta cuentas de servicio; se autoriza una vez con una persona que administre el perfil y se guarda un refresh token.

1. Cloud Console → APIs & Services → Library → habilita:
   - Business Profile Performance API
   - My Business Account Management API
   - My Business Business Information API
2. APIs & Services → **OAuth consent screen**:
   - Tipo: External. Nombre: `WRS Dashboard`.
   - Scope: `https://www.googleapis.com/auth/business.manage`.
   - **Publishing status: In production.** Si queda en "Testing", el refresh token vence a los 7 días y el dashboard deja de leer el perfil.
3. Credentials → Create credentials → **OAuth client ID** → Web application → Authorized redirect URI: `https://developers.google.com/oauthplayground`. Guarda Client ID y Client Secret → Vercel `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`.
4. Abre https://developers.google.com/oauthplayground:
   - Engranaje → marca "Use your own OAuth credentials" → pega Client ID y Secret.
   - Step 1: escribe `https://www.googleapis.com/auth/business.manage` → Authorize APIs → entra con la cuenta que administra el perfil de WRS.
   - Step 2: Exchange authorization code for tokens → copia el **Refresh token** → Vercel `GBP_REFRESH_TOKEN`.
5. Sacar el ID de la ubicación, en el mismo Playground (Step 3, método GET):
   - `https://mybusinessaccountmanagement.googleapis.com/v1/accounts` → copia el `name` (`accounts/123…`).
   - `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/123…/locations?readMask=name,title` → busca WRS → `name` es `locations/456…`.
   - Vercel `GBP_LOCATION_ID` = solo el número (`456…`).

## 10. Línea base y verificación

1. En `dashboard/data/baseline.json`:
   - `baselineStart`: primer día del período "antes de DXW" (`AAAA-MM-DD`). También se puede poner en Vercel como `BASELINE_START`.
   - `manual`: cifras que ninguna API devuelve (por ejemplo, reseñas antes de DXW, o datos de más de 16 meses). Deja `null` lo que no se sepa.
2. Redeploy en Vercel (las variables nuevas solo aplican tras un deploy).
3. Corre la primera foto diaria sin esperar al cron:
   ```bash
   curl -H "Authorization: Bearer <CRON_SECRET>" https://<url-del-dashboard>/api/cron/snapshot
   ```
   Debe responder `"ok": true` y listar `reviews`, `pagespeed`, `site` en `saved`.
4. Abre el dashboard → sección **Connections**: cada fuente debe decir **Connected**. Si dice **Error**, el texto bajo esa sección muestra el mensaje de Google o JobNimbus.

### Errores comunes

| Mensaje | Causa | Arreglo |
|---|---|---|
| `403: User does not have sufficient permissions` (GA4) | Falta el paso 4 o es otra propiedad | Revisa el correo y el Property ID |
| `403: User does not have sufficient permission for site` (GSC) | `GSC_SITE_URL` no coincide con la propiedad | Copia el formato exacto del paso 5.3 |
| `429` o cuota 0 en Business Profile | Acceso aún no aprobado | Espera el paso 1 |
| `invalid_grant` (Business Profile) | Refresh token vencido o revocado | Repite el paso 9.4 con la app en "In production" |
| `JobNimbus contacts 401` | Clave mal copiada o revocada | Genera otra en el paso 7 |
| `PageSpeed 429` | Sin `PAGESPEED_API_KEY` | Paso 8 |
