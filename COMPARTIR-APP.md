# Cómo compartir PrestamosPro para usarla en otras PCs y celulares

Mientras la app corre en **localhost**, solo la ves tú en tu computadora. Para que otros (u otros dispositivos) entren con un link, hay que **publicarla en internet**.

La forma más fácil es usar **Vercel** (gratis). Así obtienes un enlace como:

**https://tu-proyecto.vercel.app**

Ese link lo puedes abrir desde cualquier computadora o celular con internet.

---

## Opción 1: Publicar en Vercel (recomendado)

### Paso 1 - Cuenta en Vercel
1. Entra en **https://vercel.com**
2. Regístrate con tu correo o con GitHub (es gratis).

### Paso 2 - Subir el proyecto
**Si usas GitHub:**
1. Sube tu carpeta del proyecto a un repositorio en GitHub.
2. En Vercel: **Add New** → **Project**.
3. Importa el repositorio de GitHub donde está PrestamosPro.
4. Vercel detectará que es Next.js. Clic en **Deploy**.

**Si no usas GitHub (subir desde tu PC):**
1. Instala Vercel CLI (una sola vez). En CMD o PowerShell:
   ```
   npm install -g vercel
   ```
2. En la carpeta del proyecto (`app-prestamos`):
   ```
   cd C:\Users\ug94c\Downloads\app-prestamos
   vercel
   ```
3. Sigue las preguntas (login si pide, nombre del proyecto, etc.). Al final hace el deploy.

### Paso 3 - Configurar variables de entorno en Vercel
1. En Vercel, abre tu proyecto → **Settings** → **Environment Variables**.
2. Añade las mismas variables que tienes en `.env.local`:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`  
     **Value:** `https://jfddgzmccukcnmelrwei.supabase.co`
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
     **Value:** (pega tu clave anon de Supabase)
3. Guarda y haz un **Redeploy** del proyecto (Deployments → los tres puntos del último deploy → Redeploy).

### Paso 4 - Tu link público
Después del deploy, Vercel te dará una URL como:
- **https://prestamospro-xxxx.vercel.app**

Ese es el link que compartes. Cualquier persona puede abrirlo desde su computadora o celular, iniciar sesión con el usuario que creaste en Supabase y usar la app.

---

## Opción 2: Solo en tu red (misma casa/WiFi)

Si quieres que solo dispositivos en tu misma red (misma WiFi) entren:

1. En la PC donde corre la app, abre CMD y escribe: **ipconfig**
2. Busca **Dirección IPv4** (ej: 192.168.1.100).
3. Asegúrate de que la app esté corriendo (**run-dev.cmd**) y que en la consola diga algo como: **Local: http://localhost:3000**
4. En otro dispositivo en la **misma WiFi**, abre el navegador y pon: **http://192.168.1.100:3000** (usa tu IPv4).

**Limitación:** Solo funciona mientras tu PC está encendida y en la misma red. No sirve para compartir con alguien en otra casa o en datos móviles de forma estable.

---

## Resumen

| Opción   | Link ejemplo              | Quién puede entrar      |
|----------|---------------------------|--------------------------|
| Vercel   | https://xxx.vercel.app    | Cualquiera con internet  |
| Red local| http://192.168.1.100:3000 | Solo en tu misma WiFi    |

Para compartir con otras computadoras y celulares en cualquier lugar, usa **Vercel**.
