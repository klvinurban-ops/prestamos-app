# Cómo abrir PrestamosPro sin que el PC se sobrecargue

Si al ejecutar la app el PC va lento o se abren/cierran cosas solas, suele ser por falta de memoria. Sigue estos pasos en orden.

---

## Antes de abrir la app

1. **Cierra todo lo que no necesites**: navegador con muchas pestañas, otros programas, otras ventanas de Cursor/VS Code.
2. **Deja solo**:
   - Una ventana del navegador (para abrir la app).
   - Una terminal o Cursor (para ejecutar el comando).

---

## Opción A – Desde CMD (recomendado)

1. Pulsa **Windows + R**, escribe **cmd** y Enter.
2. En la ventana negra escribe (y Enter después de cada línea):

   ```text
   cd C:\Users\ug94c\Downloads\app-prestamos
   set NODE_OPTIONS=--max-old-space-size=4096
   npm run dev
   ```

3. Espera hasta que salga algo como: **Ready in X.Xs** y **Local: http://localhost:3000** (o 3001).
4. **Sin cerrar esa ventana**, abre el navegador y ve a: **http://localhost:3000** (o 3001 si lo indicó).
5. Deberías ver la pantalla de **Iniciar sesión** de PrestamosPro.

Para **cerrar la app**: en la ventana de CMD pulsa **Ctrl + C** y luego cierra la ventana.

---

## Opción B – Doble clic (solo si ya instalaste con npm install)

1. En la carpeta **app-prestamos**, haz **doble clic** en **run-dev.cmd**.
2. Se abrirá una ventana negra; espera a que diga **Ready** y la URL (localhost:3000 o 3001).
3. Abre el navegador en esa URL.

Para cerrar: cierra la ventana negra.

---

## Si sigue sin abrir o el PC se bloquea

- Cierra **todas** las demás aplicaciones y repite la Opción A.
- Si tu PC tiene poca RAM (por ejemplo 4 GB), puede que no sea suficiente. En ese caso prueba con **2** en lugar de 4096:

  ```text
  set NODE_OPTIONS=--max-old-space-size=2048
  npm run dev
  ```

---

## Recordatorio

- **No cierres** la ventana de CMD donde está corriendo `npm run dev` mientras quieras usar la app.
- La **primera vez** que abras la app puede tardar más (compilación).
- Para entrar a la app necesitas haber configurado Supabase y un usuario; ver **SETUP-SUPABASE.md**.
