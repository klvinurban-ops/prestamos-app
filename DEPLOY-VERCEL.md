# Deploy en Vercel – Checklist

## Cambios aplicados para evitar errores de build

1. **Next.js fijado en 14.2.15**  
   En `package.json` la dependencia `next` está en versión exacta (sin `^`) para que Vercel no instale Next 16.

2. **Versiones exactas**  
   Todas las dependencias usan versión fija para que el build sea reproducible.

3. **`vercel.json`**  
   Configuración explícita de framework Next.js y comando de build.

4. **`engines`**  
   Node >=18.17 y <21 para usar una versión compatible.

## Antes de hacer push a GitHub

En la carpeta del proyecto ejecuta:

```bash
npm install
```

Luego **sube también** el archivo `package-lock.json` al repositorio. Así Vercel instalará exactamente las mismas versiones.

## En el proyecto de Vercel

1. **Variables de entorno** (Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu clave anon

2. **Redeploy**  
   Después de cambiar variables o de subir los cambios de `package.json` y `vercel.json`, haz un nuevo deploy (Redeploy).

## Si el repo tiene otro nombre o está en una subcarpeta

- Si el código está en una **subcarpeta** del repo (por ejemplo `prestamos-app/`), en Vercel → Settings → General → **Root Directory** indica esa carpeta.
- Si el **nombre** del repo en GitHub es distinto (por ejemplo `prestamos-app`), no afecta al build; lo importante es que en la raíz del repo esté `package.json`, `next.config.js` y la carpeta `app/`.
