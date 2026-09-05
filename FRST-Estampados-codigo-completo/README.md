# FRST Estampados

Sistema integral para gestionar clientes, pedidos, producción, productos, stock por talle y color, cobros, comprobantes, aprobaciones de diseños y armado de metros DTF.

## Contenido del proyecto

- Aplicación React/Vinext completa.
- Logo e identidad de FRST Estampados.
- Base de datos y migraciones Drizzle/D1.
- Almacenamiento de archivos mediante R2.
- Acceso privado con inicio de sesión de ChatGPT.
- Portal de aprobación para clientes.
- Armador DTF configurable con exportación PNG a 300 DPI.

## Ejecutar y validar

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run build
npm run dev
```

La aplicación original recibe las conexiones `DB` (Cloudflare D1) y `FILES` (Cloudflare R2) desde el entorno administrado de Sites.

## Importante para Vercel o Netlify

Este ZIP es una copia completa y limpia del código publicado, pero el backend no es directamente intercambiable entre plataformas. Antes de hacer un despliegue funcional en Vercel o Netlify hay que sustituir tres integraciones del entorno actual:

1. `cloudflare:workers` y D1 por una base de datos serverless compatible, como PostgreSQL, Neon, Supabase o Turso.
2. R2 por un almacenamiento accesible desde la plataforma elegida, por ejemplo Vercel Blob, Netlify Blobs o un servicio S3 compatible.
3. El acceso privado de ChatGPT/Sites por el sistema de autenticación que se elija para el nuevo hosting.

No se incluyen contraseñas, tokens, datos privados ni credenciales en este paquete.

## Archivos dependientes del hosting actual

- `.openai/hosting.json`
- `app/chatgpt-auth.ts`
- `db/index.ts`
- `app/api/files/route.ts`

La interfaz y la lógica comercial se pueden conservar; la adaptación necesaria se concentra principalmente en base de datos, archivos y autenticación.
