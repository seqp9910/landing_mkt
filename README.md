# Landing Rappitenderos — QPAlliance

Wizard de captación de leads (Vite + React + TypeScript + Tailwind) para la campaña de TikTok Ads dirigida a Rappitenderos. Ver [CLAUDE.md](./CLAUDE.md) para las especificaciones completas del proyecto.

## Desarrollo

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase

El schema de la tabla `landing_rappitenderos` está documentado en [supabase/schema.sql](./supabase/schema.sql). Se ejecuta manualmente en el SQL editor de Supabase, no desde el código.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción (`tsc -b && vite build`)
- `npm run lint` — oxlint
- `npm run preview` — sirve el build de producción localmente
