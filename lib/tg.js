const T = () => process.env.TELEGRAM_BOT_TOKEN;
const api = (m, body) => fetch('https://api.telegram.org/bot' + T() + '/' + m, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
});

const send = (chat, text, kb) => api('sendMessage', {
  chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true,
  ...(kb ? { reply_markup: kb } : {})
});
const answerCb = (id, text) => api('answerCallbackQuery', { callback_query_id: id, text });
const clearKb = (chat, mid) => api('editMessageReplyMarkup', { chat_id: chat, message_id: mid, reply_markup: { inline_keyboard: [] } });

async function fileB64(fileId) {
  const r = await (await fetch('https://api.telegram.org/bot' + T() + '/getFile?file_id=' + fileId)).json();
  if (!r.ok) throw new Error('Telegram file nahi mili');
  const f = await fetch('https://api.telegram.org/file/bot' + T() + '/' + r.result.file_path);
  return Buffer.from(await f.arrayBuffer()).toString('base64');
}

module.exports = { send, answerCb, clearKb, fileB64 };
