-- Schema para landing de captación Rappitenderos (QPAlliance)
-- Ejecutar manualmente en el SQL editor de Supabase, NO se ejecuta desde el código.

create table public.landing_rappitenderos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Datos de contacto
  nombre text not null,
  email text not null,
  celular text not null,
  ciudad text not null,
  ciudad_otra text,

  -- Calificación (insumos)
  plataforma text not null,
  plataforma_otra text,
  cuenta_propia boolean not null,
  tiempo_actividad text not null,
  -- Valores permitidos para tiempo_actividad: '1_2_meses', '3_5_meses', '6_12_meses', 'mas_1_anio'

  -- Calificación (resultado — LA COLUMNA CLAVE)
  -- Regla: plataforma='Rappi' AND cuenta_propia=true AND tiempo_actividad IN ('6_12_meses','mas_1_anio')
  calificado boolean not null,

  -- Atribución de campaña (leídos de la URL al cargar la página)
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,

  -- Seguimiento comercial posterior
  status text not null default 'nuevo',

  -- Código de promotor (opcional, P1-P10)
  codigo_promotor text,

  -- Cumplimiento de datos personales
  acepta_tratamiento_datos boolean not null default false
);

create index on public.landing_rappitenderos (created_at);
create index on public.landing_rappitenderos (calificado);
create index on public.landing_rappitenderos (plataforma);

-- RLS: habilitar y permitir solo INSERT anónimo (lectura solo desde dashboard o service role)
alter table public.landing_rappitenderos enable row level security;

create policy "allow_anon_insert"
  on public.landing_rappitenderos
  for insert
  to anon
  with check (true);
