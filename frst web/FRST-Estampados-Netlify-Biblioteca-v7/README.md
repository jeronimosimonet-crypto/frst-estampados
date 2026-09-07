# FRST Estampados — proyecto fuente para Netlify

Sistema privado de gestión para el emprendimiento de Jeronimo Simonet. Incluye clientes, pedidos, producción, productos, stock por talle y color, pagos, comprobantes, aprobaciones, biblioteca de diseños y armador de metros DTF con medidas proporcionales.

## Funciones principales

- Clientes, pedidos y seguimiento de producción.
- Catálogo y stock por talle hasta 5XL y por color.
- Señas, pagos parciales y comprobantes imprimibles.
- Enlaces privados para aprobación de diseños por parte del cliente.
- Biblioteca persistente con carpetas, búsqueda, filtros, etiquetas y notas.
- Carga múltiple de PNG, JPG, WEBP y PDF, hasta 20 MB por archivo.
- Previsualización, descarga, edición, cambio de carpeta y eliminación.
- Envío directo de una imagen guardada al armador DTF.
- Armador predeterminado de 58 × 100 cm, dimensiones personalizables, copias, separación, control de DPI y proporción bloqueable.
- Buscador general de clientes, pedidos, productos y diseños.

Los datos y archivos se guardan de forma persistente en Netlify Blobs. El panel y sus APIs requieren la sesión privada. Los enlaces de aprobación son públicos solamente mediante un token difícil de adivinar.

## Cómo publicarlo correctamente

Este ZIP contiene **código fuente** y Netlify debe compilarlo. La pantalla de Netlify Drop no compila este tipo de ZIP; si se arrastra allí puede aparecer una página 404 o pueden faltar las funciones.

### Opción recomendada: GitHub + Netlify

1. Descomprimí el ZIP.
2. Creá un repositorio nuevo en GitHub.
3. Subí **el contenido interno de la carpeta**, de forma que `package.json` y `netlify.toml` queden en la raíz del repositorio.
4. En Netlify elegí **Add new project → Import an existing project → GitHub**.
5. Seleccioná el repositorio. Netlify leerá automáticamente:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node: `22`
6. En **Project configuration → Environment variables** agregá:
   - Key: `ADMIN_PASSWORD`
   - Value: tu contraseña privada de al menos 8 caracteres
   - Scope: todos los contextos, especialmente Production y Functions
7. Ejecutá **Deploy site**.

Al terminar, abrí el detalle del deploy y expandí **Building** y **Deploying**. El registro debe mostrar `npm run build`, la carpeta publicada `dist` y estas cinco funciones: `frst-app`, `frst-state`, `frst-login`, `frst-files` y `frst-approval`.

Si el deploy figura como **Complete** pero el sitio muestra **Page not found**, comprobá que el proyecto no tenga un *Base directory* agregado manualmente y que **Publish directory** sea `dist`. Esta versión también genera `dist/_redirects` explícitamente para evitar ese 404.

Para actualizar el sistema más adelante, reemplazá los archivos del repositorio y hacé un nuevo commit. Netlify volverá a desplegarlo automáticamente sin borrar la información almacenada en el mismo sitio.

### Opción alternativa: Netlify CLI

Con Node.js 22 instalado, descomprimí el proyecto, abrí una terminal en esa carpeta y ejecutá:

```bash
npm install
npx netlify login
npx netlify link
npx netlify deploy --build --prod
```

## Datos limpios y persistencia

El sistema comienza vacío: no incluye clientes, productos, pedidos, stock, pagos, aprobaciones, carpetas ni diseños ficticios. Los registros usan `frst-estampados-datos` y los archivos originales usan `frst-estampados-archivos`. Ambos almacenes persisten entre despliegues del mismo proyecto de Netlify.

## Validación local

```bash
npm install
npm run build
```

Para probar el acceso y Netlify Blobs localmente, creá un archivo `.env` con `ADMIN_PASSWORD` y ejecutá:

```bash
npm run netlify:dev
```

No escribas la contraseña dentro de archivos que vayas a subir a GitHub.
