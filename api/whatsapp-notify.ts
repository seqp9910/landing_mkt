import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
  // TEMP DEBUG: remove after root cause confirmed in Vercel logs
  console.log('[whatsapp-notify] env check', {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    WHATSAPP_ACCESS_TOKEN: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
    WHATSAPP_PHONE_NUMBER_ID: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
    WHATSAPP_TEMPLATE_NAME: Boolean(process.env.WHATSAPP_TEMPLATE_NAME),
    SUPABASE_WEBHOOK_SECRET: Boolean(process.env.SUPABASE_WEBHOOK_SECRET),
  });

  try {
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

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
            language: { code: 'es_CO' },
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
      console.error('[whatsapp-notify] supabase update failed', updateErr);
      return res.status(200).json({
        sent: !whatsappError,
        updateFailed: true,
      });
    }

    return res.status(200).json({ sent: !whatsappError, whatsappError });
  } catch (err) {
    // TEMP DEBUG: remove after root cause confirmed in Vercel logs
    console.error(
      '[whatsapp-notify] unhandled error',
      err instanceof Error ? { message: err.message, stack: err.stack } : err
    );
    return res.status(500).json({ error: 'Internal error' });
  }
}
