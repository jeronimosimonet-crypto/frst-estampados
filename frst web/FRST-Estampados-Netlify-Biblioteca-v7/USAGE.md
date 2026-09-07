# INSTRUCCIONES RÁPIDAS — NETLIFY

Este es un proyecto fuente con funciones y base persistente. No lo arrastres a Netlify Drop como si fuera una web estática.

1. Descomprimí el ZIP.
2. Subí a un repositorio de GitHub todos los archivos internos. `package.json` y `netlify.toml` deben quedar en la raíz.
3. En Netlify: **Add new project → Import an existing project → GitHub**.
4. Elegí el repositorio y desplegá. La configuración de compilación ya está incluida.
5. En **Project configuration → Environment variables** conservá o creá `ADMIN_PASSWORD`, con al menos 8 caracteres y alcance para Production y Functions.

En el deploy terminado, expandí **Deploying** y verificá que aparezcan cinco funciones: `frst-app`, `frst-state`, `frst-login`, `frst-files` y `frst-approval`. Si no aparecen, el repositorio se cargó con una carpeta extra por encima de `package.json` y `netlify.toml`.

Si actualizás el mismo proyecto de Netlify, tus clientes, pedidos, carpetas y diseños continúan guardados en Netlify Blobs.
