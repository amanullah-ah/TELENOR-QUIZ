// Telegram webhook ko Vercel server se set karta hai (jab phone/ISP par api.telegram.org band ho).
// Use: https://APNI-SITE/api/setup?key=WEBHOOK_SECRET
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const secret = process.env.WEBHOOK_SECRET;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !token) return res.status(500).end(JSON.stringify({ ok: false, error: 'WEBHOOK_SECRET ya TELEGRAM_BOT_TOKEN Vercel mein set nahi' }));
  if (req.query.key !== secret) return res.status(401).end(JSON.stringify({ ok: false, error: 'key ghalat hai' }));
  try {
    const url = 'https://' + req.headers.host + '/api/telegram';
    const set = await (await fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true })
    })).json();
    const info = await (await fetch('https://api.telegram.org/bot' + token + '/getWebhookInfo')).json();
    res.status(200).end(JSON.stringify({ set, webhook: info.result && { url: info.result.url, pending: info.result.pending_update_count, last_error: info.result.last_error_message || null } }));
  } catch (e) {
    res.status(500).end(JSON.stringify({ ok: false, error: String(e && e.message || e) }));
  }
};
