# Taller de maletas — gestión de órdenes

MVP para gestionar órdenes de reparación en el taller, complementario al
POS existente (se vinculan por `numero_recibo`). Next.js (App Router) +
Supabase (base de datos, auth, storage) + Tailwind CSS.

## Setup

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un proyecto en [supabase.com](https://supabase.com) (o usar uno
   existente).

3. Copiar `.env.local.example` a `.env.local` y completar con los datos
   de tu proyecto (Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. Ejecutar la migración inicial en el **SQL Editor** de Supabase: copiar
   y correr el contenido de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Esto crea las tablas (`ordenes`, `fotos`, `historial_estados`), los
   triggers (actualización de `updated_at` e historial automático de
   cambios de estado), el bucket de Storage `fotos-ordenes`, y las
   políticas de RLS.

   > **Nota sobre seguridad:** el MVP no tiene login propio (se usa
   > desde el mostrador del taller), así que las políticas de RLS
   > permiten acceso completo al rol `anon`. Antes de exponer la app
   > fuera de la red del taller, agregar autenticación y restringir
   > las políticas a `authenticated`.

5. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Estructura

- `src/app` — rutas (App Router).
- `src/lib/supabase` — clientes de Supabase (browser y server).
- `src/lib/estado.ts` — labels, colores por estado y mensajes de WhatsApp.
- `src/types/database.ts` — tipos TypeScript del esquema.
- `supabase/migrations` — SQL de la base de datos.
