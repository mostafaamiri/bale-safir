export async function sendMessage({ botId, phoneNumber, text, apiKey }) {
  const direct = import.meta.env.VITE_DIRECT_API === 'true';
  const baseUrl = direct ? 'https://safir.bale.ai' : '';
  const url = `${baseUrl}/api/v3/send_message`;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['api-access-key'] = apiKey;
  } else if (direct && import.meta.env.VITE_API_ACCESS_KEY) {
    headers['api-access-key'] = import.meta.env.VITE_API_ACCESS_KEY;
  }

  const payload = {
    bot_id: Number(botId),
    phone_number: String(phoneNumber).trim(),
    message_data: { message: { text } }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  let data = null;
  try { data = await res.json(); } catch { /* ignore non-JSON */ }

  if (!res.ok) {
    const reason = data?.error || res.statusText || 'Request failed';
    throw new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
  }

  return data;
}

export async function sendMessageByChatId({ botToken, chatId, text }) {
  const trimmedToken = String(botToken || '').trim();
  if (!trimmedToken) throw new Error('Bot token is required');

  const trimmedChatId = String(chatId || '').trim();
  if (!trimmedChatId) throw new Error('chat_id is required');

  const params = new URLSearchParams();
  params.set('chat_id', trimmedChatId);
  params.set('text', text);

  const url = `https://tapi.bale.ai/bot${trimmedToken}/sendMessage?${params.toString()}`;

  const res = await fetch(url, { method: 'GET' });

  let data = null;
  try { data = await res.json(); } catch { /* ignore non-JSON */ }

  if (!res.ok) {
    const reason = data?.description || data?.error || res.statusText || 'Request failed';
    throw new Error(typeof reason === 'string' ? reason : JSON.stringify(reason));
  }

  return data;
}

export function normalizePhone(input) {
  const digits = String(input).replace(/[^0-9]/g, '');
  if (!digits) return '';
  // If starts with 98, assume complete MSISDN; if starts with 0 or 9, try to normalize to 98XXXXXXXXXX
  if (digits.startsWith('98') && digits.length >= 11) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `98${digits.slice(1)}`;
  if (digits.startsWith('9') && digits.length >= 10) return `98${digits}`;
  return digits;
}
