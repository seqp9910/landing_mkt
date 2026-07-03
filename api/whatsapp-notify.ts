import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LeadRecord {
  id: string;
  calificado: boolean;
  celular: string;
  nombre: string;
  whatsapp_sent_at: string | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: LeadRecord;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body as WebhookPayload;
  const record = payload?.record;

  if (!record || payload.type !== 'INSERT') {
    return res.status(200).json({ skipped: true, reason: 'not an insert' });
  }

  if (record.calificado !== true) {
    return res.status(200).json({ skipped: true, reason: 'not calificado' });
  }

  if (record.whatsapp_sent_at !== null) {
    return res.status(200).json({ skipped: true, reason: 'already sent' });
  }

  const normalizedPhone = record.celular.replace(/\D/g, '');

  let whatsappMessageId: string | null = null;
  let whatsappError: string | null = null;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: process.env.WHATSAPP_TEMPLATE_NAME,
            language: { code: 'es' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: record.nombre }],
              },
            ],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      whatsappError = JSON.stringify(data);
    } else {
      whatsappMessageId = data?.messages?.[0]?.id ?? null;
    }
  } catch (err) {
    whatsappError = err instanceof Error ? err.message : String(err);
  }

  try {
    await supabaseAdmin
      .from('landing_rappitenderos')
      .update({
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_message_id: whatsappMessageId,
        whatsapp_error: whatsappError,
      })
      .eq('id', record.id);
  } catch (updateErr) {
    return res.status(200).json({
      sent: !whatsappError,
      updateFailed: true,
    });
  }

  return res.status(200).json({ sent: !whatsappError, whatsappError });
}
