# Distribución de Escenario — Coro Municipal Cochabamba

App para planificar la distribución de integrantes en el escenario del
Concierto de Primavera 2026, a partir de los planos de `Escenario.pdf` y el
listado de `Componentes.pdf`.

- Tres pestañas con los diagramas del escenario (1ª/3ª parte, 2ª parte, 4ª
  parte), como SVG vectorial — se puede hacer zoom sin perder resolución.
- Cada posición del escenario se llena automáticamente según el orden del
  listado de integrantes, por voz.
- Modo edición (requiere iniciar sesión): reasignar quién ocupa cada
  posición, cambiar a qué voz/región pertenece una posición, agregar o
  quitar integrantes del listado.
- Los datos (integrantes, posiciones, regiones) se guardan en Supabase y se
  sincronizan en tiempo real entre todos los que tengan la app abierta.

## Configuración local

1. `npm install`
2. Copia `.env.example` a `.env.local` y completa con los datos de tu
   proyecto de Supabase (Project Settings → API):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Corre el archivo `supabase/migrations/0001_init.sql` en el SQL Editor de
   tu proyecto de Supabase (crea las tablas, políticas de seguridad y carga
   el listado inicial de integrantes).
4. Crea al menos una cuenta de guía/director en Supabase → Authentication →
   Users → Add user (correo + contraseña). Esa cuenta es la que se usa para
   iniciar sesión y activar el modo edición en la app.
5. `npm run dev`

## Despliegue

- **Frontend (Vercel)**: importa este repositorio en
  [vercel.com/new](https://vercel.com/new) y agrega las mismas variables de
  entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en la
  configuración del proyecto en Vercel.
- **Backend (Supabase)**: no requiere servidor propio — Supabase provee la
  base de datos, autenticación y sincronización en tiempo real directamente
  desde el frontend.
