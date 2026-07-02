# CLAUDE.md — Landing de captación Rappitenderos (QPAlliance)

Este archivo contiene las instrucciones completas para construir el proyecto. Léelo entero antes de generar cualquier código.

---

## 1. Qué estamos construyendo

Una landing page de captación de leads para una campaña de TikTok Ads. El público objetivo son domiciliarios (Rappitenderos) que trabajan con cuenta propia en apps de domicilios. El objetivo de negocio es identificar a quienes cumplen el perfil (ICP) para un proceso de defensa de derechos laborales contra Rappi, liderado por QPAlliance (firma jurídica).

Formato: **wizard de una pregunta por pantalla** (estilo Typeform), 7 pasos, mobile-first (el 100% del tráfico viene de TikTok, es decir, móvil). Al final, el registro se guarda en Supabase y se muestra un mensaje distinto según si el lead califica o no para el proceso.

**Importante: todos los leads se guardan, califiquen o no.** Los que no califican alimentan una secuencia de remarketing futura — no se descartan del formulario, solo cambian de mensaje final y quedan marcados como no calificados en la base de datos.

---

## 2. Preguntas exactas (una por pantalla, en este orden)

| Paso | Pregunta en pantalla | Tipo de input | Opciones | Obligatorio |
|---|---|---|---|---|
| 1 | ¿Cómo te llamas? | Texto abierto | — | Sí |
| 2 | ¿Cuál es tu correo? | Email | — | Sí |
| 3 | ¿Cuál es tu número de WhatsApp? | Numérico, 10 dígitos | — | Sí |
| 4 | ¿En qué ciudad vives? | Selección única (botones) | Bogotá · Medellín · Bucaramanga · Neiva · Villavicencio · Otra ciudad | Sí |
| 4b | (Solo si eligió "Otra ciudad") ¿Cuál? | Texto abierto | — | Sí, solo si aplica |
| 5 | ¿En qué app trabajas como domiciliario? | Selección única (botones) | Rappi · DiDi Repartidor · Mensajeros Urbanos · Picap · Otra | Sí |
| 5b | (Solo si eligió "Otra") ¿Cuál? | Texto abierto | — | Sí, solo si aplica |
| 6 | ¿Esa cuenta es tuya? | Selección única (botones) | Sí, es mía · No, es de otra persona | Sí |
| 7 | ¿Hace cuánto tiempo haces pedidos en la app? | Selección única (botones) | De 1 a 2 meses · De 3 a 5 meses · De 6 a 12 meses · Hace más de 1 año | Sí |
| 8 | Casilla de consentimiento (ver sección 5) | Checkbox | — | Sí |

Validaciones en cliente:
- Email: regex simple de formato válido.
- Celular: exactamente 10 dígitos numéricos.
- Nombre: no vacío, mínimo 3 caracteres.

---

## 3. Lógica de calificación — CAMPO `calificado` (boolean)

Esta es la pieza más importante del proyecto. Al enviar el formulario, calcula en el cliente un booleano `calificado` con esta regla exacta, y guárdalo en Supabase como su propia columna (no como texto, como `true`/`false` real):

```
calificado = (plataforma === 'Rappi')
          AND (cuenta_propia === true)
          AND (tiempo_actividad === '6_12_meses' OR tiempo_actividad === 'mas_1_anio')
```

Las tres condiciones son estrictas y las tres deben cumplirse:
1. La plataforma seleccionada en el paso 5 debe ser exactamente **"Rappi"** (si elige DiDi, Picap, Mensajeros Urbanos u Otra → `calificado = false`, aunque cumpla las otras dos condiciones).
2. `cuenta_propia` debe ser `true` (paso 6 = "Sí, es mía").
3. `tiempo_actividad` debe ser "6 a 12 meses" o "más de 1 año" (paso 7).

Si cualquiera de las tres falla, `calificado = false`.

**Por qué esto importa:** el equipo comercial va a filtrar directamente por esta columna en Supabase para armar segmentos y campañas de remarketing más adelante, sin tener que recalcular la lógica cada vez. La columna debe quedar lista para usarse en un `WHERE calificado = true` tal cual.

### Pantallas de resultado final

Si `calificado === true`, mostrar:
> **¡Ya casi terminamos!**
> Revisa tu WhatsApp. Muy pronto recibirás toda la información para iniciar tu proceso de defensa de tus derechos laborales.

Si `calificado === false`, mostrar:
> **Gracias por tu interés.**
> Por ahora no cumples con el perfil para este proceso, pero te avisaremos si eso cambia.

---

## 4. Esquema de Supabase

Crea esta tabla exactamente así (respeta nombres de columnas, son snake_case a propósito porque así están las demás tablas del proyecto en Supabase):

```sql
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

  -- Calificación (resultado — LA COLUMNA CLAVE)
  calificado boolean not null,

  -- Atribución de campaña (leer de la URL al cargar la página)
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,

  -- Seguimiento comercial posterior
  status text not null default 'nuevo',

  -- Cumplimiento de datos personales
  acepta_tratamiento_datos boolean not null default false
);

create index on public.landing_rappitenderos (created_at);
create index on public.landing_rappitenderos (calificado);
create index on public.landing_rappitenderos (plataforma);
```

Valores permitidos para `tiempo_actividad` (guardar el código, no el texto de la pantalla):
- `'1_2_meses'`
- `'3_5_meses'`
- `'6_12_meses'`
- `'mas_1_anio'`

El índice en `calificado` es intencional: es el campo que más se va a filtrar después, debe responder rápido.

---

## 5. Casilla de consentimiento de datos personales

Antes del botón final de envío, incluir (obligatoria, sin marcar por defecto):

> ☐ Autorizo a QPAlliance el tratamiento de mis datos personales conforme a la [Política de Privacidad], para ser contactado sobre mi proceso de defensa laboral.

`TODO: reemplazar el link de "Política de Privacidad" por la URL real antes de publicar la campaña. Por ahora usar "#" como placeholder y dejar un comentario en el código marcando este pendiente.`

---

## 6. Stack técnico

- **Frontend:** Vite + React + TypeScript + Tailwind CSS.
- **Backend:** ninguno propio. Insertar directo a Supabase desde el cliente con `@supabase/supabase-js`.
- **Variables de entorno** (`.env`, y agregar `.env.example` sin valores reales):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- **Nunca** usar la service role key en el frontend — solo la anon key, protegida por RLS (ver sección 7).
- **Hosting objetivo:** Vercel. Dominio placeholder: `rappi.qpalliance.co` (puede cambiar, no bloquea el desarrollo).
- **Captura de UTMs:** al montar la app, leer `window.location.search` (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`) y guardarlos en el estado del formulario para incluirlos en el insert final. Si no existen en la URL, guardar `null`.

### Política de RLS sugerida en Supabase

Habilitar RLS en `landing_rappitenderos` y crear una policy que permita `insert` público (anon) pero **no** `select`/`update`/`delete` desde el cliente anónimo — la lectura de leads se hace desde el dashboard de Supabase o desde n8n con la service role, nunca desde el frontend público.

---

## 7. Estructura del proyecto

```
/src
  /components
    StepWizard.tsx        -- controla el paso activo, la barra de progreso y la navegación
    StepText.tsx          -- input de texto abierto (usado en pasos 1, 3, 4b, 5b)
    StepEmail.tsx          -- input de email (paso 2)
    StepChoice.tsx          -- selección única con botones (pasos 4, 5, 6, 7)
    StepConsent.tsx          -- checkbox de consentimiento + botón de envío final (paso 8)
    ResultScreen.tsx      -- pantalla final, recibe `calificado` como prop y cambia el mensaje
    ProgressBar.tsx           -- barra delgada de avance, sin números de paso visibles
    Logo.tsx                  -- logo de QPAlliance, visible en todas las pantallas
  /lib
    supabase.ts               -- cliente de Supabase inicializado con las env vars
    qualification.ts          -- función pura `isCalificado(data)` con la lógica de la sección 3 (testeable aislada del formulario)
    utm.ts                    -- función pura para leer UTMs de la URL
  /types
    lead.ts                   -- tipos TypeScript del formulario y del registro de Supabase
  App.tsx
  main.tsx
.env.example
```

La función `isCalificado` debe vivir separada del componente del formulario, para poder testearla con casos simples sin necesidad de renderizar UI.

---

## 8. Lineamientos de diseño (marca QPAlliance)

- **Tipografía:** Manrope (importar de Google Fonts).
- **Color de acento / CTA:** `#E84C88`.
- **Color de fondo/texto oscuro:** `#1A1A2E`.
- **Logo QPAlliance:** visible en todas las pantallas del wizard, no solo en la portada — pequeño, arriba, centrado o esquina superior izquierda.
- **Botones:** ancho completo en móvil, un solo CTA visible por pantalla, sin distractores ni menús.
- **Barra de progreso:** delgada, arriba de la pantalla, solo visual — sin texto tipo "pregunta 3 de 7".
- **Cada pantalla muestra únicamente la pregunta activa** — nada de scroll largo ni preguntas visibles antes de tiempo.
- **Transiciones entre pasos:** simples (fade o slide corto), sin animaciones pesadas — el usuario viene de TikTok, prioriza velocidad de carga sobre efectos.

---

## 9. Qué NO hacer

- No mostrar más de una pregunta a la vez en pantalla.
- No usar la service role key de Supabase en ningún archivo del frontend.
- No guardar `tiempo_actividad` como el texto visible de la opción — guardar el código (`6_12_meses`, etc.).
- No omitir el registro en Supabase cuando el lead no califica — siempre se guarda.
- No hardcodear la URL o la anon key de Supabase en el código — siempre desde variables de entorno.

---

## 10. Orden sugerido de construcción

1. Inicializar proyecto Vite + React + TypeScript + Tailwind.
2. Crear `.env.example` y `lib/supabase.ts`.
3. Crear el schema SQL de la sección 4 como archivo `supabase/schema.sql` (documentación, no se ejecuta desde el código — se corre manualmente en el SQL editor de Supabase).
4. Implementar `lib/qualification.ts` y `lib/utm.ts` primero, aislados.
5. Construir los componentes de paso uno por uno, siguiendo el orden de la tabla de la sección 2.
6. Ensamblar `StepWizard.tsx` con el estado del formulario completo.
7. Conectar el insert final a Supabase, incluyendo `calificado` ya calculado y los UTMs capturados.
8. Aplicar estilos de marca (sección 8).
9. Probar manualmente los dos caminos: un registro que califica y uno que no, verificando en Supabase que la columna `calificado` quede correcta en ambos.
