# Aurity

Una aplicación moderna desarrollada con Next.js 14, TypeScript y Tailwind CSS.

## Características

- ⚡ Next.js 14 con App Router
- 🔷 TypeScript para type safety
- 🎨 Tailwind CSS para estilos
- 📱 Diseño responsive
- 🌙 Soporte para modo oscuro
- ✅ ESLint configurado
- 🚀 Optimizado para producción

## Comenzar

Primero, instala las dependencias:

```bash
npm install
# o
yarn install
# o
pnpm install
```

Luego, ejecuta el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta ESLint
- `npm run type-check` - Verifica los tipos de TypeScript

## Estructura del Proyecto

```
src/
  app/
    layout.tsx      # Layout principal
    page.tsx        # Página de inicio
    globals.css     # Estilos globales
  components/
    Header.tsx      # Componente del header
  lib/             # Utilidades y helpers
  types/           # Definiciones de tipos TypeScript
  styles/          # Archivos de estilos adicionales
```

## Despliegue

La forma más fácil de desplegar tu aplicación Next.js es usar [Vercel](https://vercel.com/new).

Consulta la [documentación de despliegue de Next.js](https://nextjs.org/docs/deployment) para más detalles.