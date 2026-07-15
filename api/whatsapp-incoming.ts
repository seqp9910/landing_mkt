import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface IncomingMessage {
  id: string;
  from: string;
  type: string;
}

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        messages?: IncomingMessage[];
      };
    }>;
  }>;
}

const AUTO_REPLY_TEXT =
  'Hola, con gusto te atenderé en el siguiente chat, gracias por contactar con QPAlliance: https://wa.link/ri42fj';

async function sendAutoReply(to: string) {
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
        to,
        type: 'text',
        text: { body: AUTO_REPLY_TEXT },
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(JSON.stringify(data));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const verifyToken = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
      const receivedToken = typeof verifyToken === 'string' ? verifyToken.trim() : verifyToken;

      if (mode === 'subscribe' && receivedToken === expectedToken) {
        return res.status(200).send(challenge);
      }

      return res.status(403).json({ error: 'Verification failed' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body as WhatsAppWebhookPayload;
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const receivingPhoneNumberId = value?.metadata?.phone_number_id;

    // TEMP DEBUG: remove after root cause confirmed in Vercel logs
    console.log('[whatsapp-incoming] phone check', {
      receivingPhoneNumberId: `[${receivingPhoneNumberId}]`,
      expected: `[${process.env.WHATSAPP_PHONE_NUMBER_ID}]`,
      match: receivingPhoneNumberId === process.env.WHATSAPP_PHONE_NUMBER_ID,
    });

    if (message && receivingPhoneNumberId === process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error: dedupeError } = await supabaseAdmin
        .from('whatsapp_incoming_dedupe')
        .insert({ message_id: message.id });

      if (dedupeError && dedupeError.code !== '23505') {
        // Fallo transitorio de DB: no enviamos, para no arriesgar duplicados
        // si el insert en realidad sí se aplicó pero la respuesta se perdió.
        console.error('[whatsapp-incoming] dedupe insert failed, skipping send', dedupeError);
      } else if (!dedupeError) {
        void sendAutoReply(message.from).catch((err) => {
          console.error('[whatsapp-incoming] auto-reply failed', err);
        });
      }
      // dedupeError?.code === '23505' => ya procesado, no hacer nada.
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(
      '[whatsapp-incoming] unhandled error',
      err instanceof Error ? { message: err.message, stack: err.stack } : err
    );
    return res.status(500).json({ error: 'Internal error' });
  }
}
