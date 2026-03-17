# Subir PrestamosPro a GitHub – Paso a paso (para novatos)

Estás en la página de GitHub donde dice **"Drag files here"** o **"Or choose your files"**. Sigue estos pasos.

---

## Paso 1 – Abrir la carpeta del proyecto en tu PC

1. Abre el **Explorador de archivos** de Windows (carpeta en la barra de tareas).
2. Ve a la carpeta donde está el proyecto. Por ejemplo:
   - `C:\Users\ug94c\Downloads\app-prestamos`
   - o la ruta donde tengas guardado el proyecto PrestamosPro.

---

## Paso 2 – Saber qué subir y qué NO subir

**SÍ debes subir estas carpetas y archivos** (toda la app menos lo que no sirve en GitHub):

- Carpeta **`app`**
- Carpeta **`components`**
- Carpeta **`lib`**
- Carpeta **`types`**
- Carpeta **`supabase`**
- Archivo **`package.json`**
- Archivo **`package-lock.json`** (si existe)
- Archivo **`next.config.js`**
- Archivo **`tsconfig.json`**
- Archivo **`tailwind.config.ts`**
- Archivo **`postcss.config.js`** (si existe)
- Archivo **`vercel.json`**
- Archivo **`.env.local.example`** o **`.env.example`** (nunca subas `.env.local` con claves)
- Archivo **`middleware.ts`** (en la raíz, si existe)
- Archivos **`.gitignore`**, **`README.md`** y los **`.md`** que quieras (guías, etc.)

**NO subas:**

- Carpeta **`node_modules`** (pesa mucho y Vercel la genera al hacer deploy).
- Carpeta **`.next`** (se genera al hacer build).
- Archivo **`.env.local`** (tiene tus claves; no debe estar en GitHub).

---

## Paso 3 – Preparar los archivos para subir

**Opción A – Subir todo menos lo que no se debe (recomendada)**

1. En la carpeta del proyecto (`app-prestamos`), selecciona **todo** (Ctrl + A).
2. **Quita la selección** de:
   - carpeta **`node_modules`** (clic en una zona vacía y luego clic en `node_modules` y Eliminar de la selección, o mantén Ctrl y haz clic en `node_modules` para deseleccionarla);
   - carpeta **`.next`** si existe (igual, deselecciónala);
   - archivo **`.env.local`** si lo ves (deselecciónalo).
3. Con el resto seleccionado, **copia** (Ctrl + C).

**Opción B – Ir carpeta por carpeta**

Si te resulta más fácil, en GitHub puedes subir por partes:

1. **Primera subida:** arrastra o elige solo los **archivos sueltos** de la raíz:  
   `package.json`, `package-lock.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `vercel.json`, `.gitignore`, `README.md`, etc. (y **no** el `.env.local`).
2. Luego **crea una carpeta** (en GitHub: "Add file" → "Create new file", y en el nombre escribe por ejemplo `app/archivo.txt` para que cree la carpeta `app`; luego borra ese archivo o sustituye por el contenido real). O más fácil: arrastra la carpeta **`app`** entera desde tu PC.
3. Repite con las carpetas **`components`**, **`lib`**, **`types`**, **`supabase`** (arrastrando cada una desde tu PC).

---

## Paso 4 – Subir en GitHub (en la página donde estás)

1. En la página de GitHub donde dice **"Drag files here to add them to your repository"**:
   - **Opción 1:** Arrastra desde el Explorador de Windows la carpeta del proyecto (con todo lo que quieras subir, **sin** `node_modules`, **sin** `.next`, **sin** `.env.local`).  
   - **Opción 2:** Clic en **"Or choose your files"** y en la ventana que se abre ve a tu carpeta del proyecto y selecciona las carpetas y archivos (sin `node_modules`, `.next`, `.env.local`).
2. Espera a que termine de subir (verás los nombres de archivos/carpetas en la página).
3. Abajo, en **"Commit changes"**:
   - En el primer cuadro de texto puedes poner por ejemplo: **"Subir proyecto PrestamosPro"**.
   - Deja marcado **"Commit directly to the main branch"**.
4. Clic en el botón verde **"Commit changes"**.

Con eso el código ya está en GitHub.

---

## Paso 5 – Después de subir

1. **Vercel:** Si el proyecto ya está conectado a ese repositorio en Vercel, hará un deploy solo. Si no, en Vercel crea un proyecto nuevo e importa el repo **klvinurban-ops/prestamos-app**.
2. En Vercel, en **Settings → Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vuelve a desplegar (Redeploy) si hace falta.

---

## Resumen rápido

1. Abre la carpeta del proyecto en tu PC.
2. Selecciona todo **menos** `node_modules`, `.next` y `.env.local`.
3. En GitHub, en "Drag files here" / "Or choose your files", sube lo que seleccionaste.
4. Escribe un mensaje de commit y haz clic en **"Commit changes"**.

Si en algún paso te pide crear carpeta o archivo y no sabes el nombre exacto, dime en qué paso estás y qué ves en pantalla y te digo qué poner.
