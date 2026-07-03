alter table public.landing_rappitenderos
  add column whatsapp_sent_at timestamptz,
  add column whatsapp_message_id text,
  add column whatsapp_error text;
