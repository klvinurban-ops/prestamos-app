# PrestamosPro – Configuración de Supabase (paso a paso)

Sigue estos pasos en orden. Así la app tendrá base de datos y podrás iniciar sesión.

---

## 1. Entrar a Supabase

1. Abre el navegador y ve a: **https://supabase.com**
2. Haz clic en **Start your project** (o **Iniciar sesión**).
3. Inicia sesión con GitHub o con tu correo.

---

## 2. Crear un proyecto

1. Dentro de Supabase, haz clic en **New Project** (Nuevo proyecto).
2. **Organization**: deja la que tengas o crea una.
3. **Name**: escribe por ejemplo `prestamospro`.
4. **Database Password**: inventa una contraseña **fuerte** y **guárdala** (la pide Supabase para la base de datos).
5. **Region**: elige la más cercana a ti (por ejemplo South America).
6. Haz clic en **Create new project**.
7. Espera 1–2 minutos hasta que el proyecto esté listo (verde).

---

## 3. Crear las tablas (Clientes, Préstamos, Pagos)

1. En el menú izquierdo, haz clic en **SQL Editor** (ícono de “</>”).
2. Haz clic en **New query** (Nueva consulta).
3. Abre en tu PC la carpeta del proyecto y el archivo **`supabase/schema.sql`** (con Bloc de notas o Cursor).
4. **Selecciona todo** el contenido de `schema.sql` y **cópialo** (Ctrl+C).
5. Vuelve a Supabase, al cuadro de texto del SQL Editor, y **pega** todo (Ctrl+V).
6. Abajo a la derecha haz clic en **Run** (o Ctrl+Enter).
7. Debe salir algo como “Success” o “Success. No rows returned”. Si sale error, revisa que hayas pegado todo.

Con esto ya tienes las tablas: **clients**, **loans**, **payments**.

---

## 4. Crear un usuario para iniciar sesión en la app

1. En el menú izquierdo, haz clic en **Authentication**.
2. Entra en **Users** (Usuarios).
3. Haz clic en **Add user** → **Create new user**.
4. **Email**: pon tu correo (ej: `tu@email.com`).
5. **Password**: inventa una contraseña para entrar a PrestamosPro (mínimo 6 caracteres).
6. Anota **email y contraseña**; los usarás en la app.
7. Haz clic en **Create user**.

Ese usuario es el que usarás para **Iniciar sesión** en PrestamosPro.

---

## 5. Obtener URL y clave (para la app)

1. En el menú izquierdo, haz clic en **Project Settings** (engranaje).
2. Entra en **API** (en el submenú).
3. Verás:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** (una clave larga que empieza por `eyJ...`)
4. **Copia** la **Project URL** y la **anon public** y guárdalas en un lugar seguro.

---

## 6. Poner la URL y la clave en tu proyecto

1. En la carpeta del proyecto (`app-prestamos`), busca el archivo **`.env.example`**.
2. **Cópialo** y renómbralo a **`.env.local`** (en la misma carpeta).
3. Abre **`.env.local`** con el Bloc de notas o Cursor.
4. Sustituye:
   - Donde dice `https://your-project-ref.supabase.co` → pega tu **Project URL**.
   - Donde dice `your-anon-key` → pega tu **anon public**.
5. Guarda el archivo (Ctrl+S).

Ejemplo (con datos inventados):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Resumen

| Paso | Dónde | Qué hiciste |
|------|--------|-------------|
| 1–2 | Supabase | Crear proyecto |
| 3 | SQL Editor | Pegar y ejecutar `supabase/schema.sql` |
| 4 | Authentication → Users | Crear usuario (email + contraseña) |
| 5 | Project Settings → API | Copiar URL y anon key |
| 6 | Carpeta del proyecto | Crear `.env.local` con esa URL y clave |

Cuando termines, al abrir la app y entrar en **Iniciar sesión**, usa el **mismo email y contraseña** que creaste en el paso 4.

---

## Si ves "connection failed" o "No se pudo conectar"

1. **¿Existe el archivo `.env.local`?**  
   Debe estar en la carpeta del proyecto (donde está `package.json`), no dentro de `app` ni de `src`.

2. **¿Tiene las dos variables?**  
   Abre `.env.local` y comprueba que hay exactamente:
   - `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`  
   (sin comillas, sin espacios alrededor del `=`).

3. **¿Los valores son los correctos?**  
   En Supabase: **Project Settings** → **API** → copia de nuevo la **Project URL** y la clave **anon public** y pégalos en `.env.local`.

4. **Reinicia el servidor**  
   Después de cambiar `.env.local`, cierra la terminal donde corre `npm run dev` y vuelve a ejecutar `npm run dev`.

5. **Comprueba el proyecto en Supabase**  
   Entra en https://app.supabase.com y verifica que el proyecto está en estado "Active" (verde), no pausado.
