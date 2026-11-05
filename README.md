# OG NAME FINDER

Buscador de nombres Roblox de exactamente 3 caracteres. Proyecto para Cloudflare Pages.

## Archivos
- `index.html`: interfaz web.
- `functions/api/check.js`: función de Cloudflare Pages que consulta el validador de Roblox desde el servidor para evitar problemas CORS.

## Publicar en Cloudflare Pages
1. Sube esta carpeta a un repositorio GitHub.
2. En Cloudflare, entra a **Workers & Pages → Create → Pages → Connect to Git**.
3. Selecciona el repositorio.
4. Framework preset: **None**.
5. Build command: déjalo vacío.
6. Build output directory: `/` (raíz del proyecto).
7. Despliega.

La carpeta `functions/` debe estar en la raíz para que Cloudflare Pages reconozca `/api/check`.

## Cómo funciona
La página genera candidatos aleatorios y los consulta secuencialmente, con una pausa de 1.6 segundos entre solicitudes. Incluye el modo **Letras raras primero**, una heurística que prioriza q, z, x, j, v, k y w para explorar combinaciones menos comunes. No consulta una lista de nombres raros de Roblox ni garantiza mayor disponibilidad. No usa cookies, contraseñas ni sesiones de Roblox. Si Roblox responde con límite de velocidad, la búsqueda se detiene.

La función interpreta `code` del validador de nombres de Roblox:
- `0`: válido/disponible según la validación.
- `1`: ocupado.
- `2`: no válido.
- Cualquier otro resultado: no confirmado.

## Importante
- La disponibilidad puede cambiar antes de que intentes registrar el nombre.
- Roblox puede aplicar límites, filtros o restricciones adicionales durante el registro.
- No se garantiza que un nombre marcado como disponible pueda registrarse.
- No hagas búsquedas masivas ni intentes evadir límites de Roblox.
- Herramienta independiente, no afiliada a Roblox.
