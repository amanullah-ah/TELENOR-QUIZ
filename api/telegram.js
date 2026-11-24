const { db, FieldValue } = require('../lib/firebase');
const { parseAnswers, parseOne, parseBlock, looksLikeBlock } = require('../lib/parse');
const { send, answerCb, clearKb, fileB64 } = require('../lib/tg');
const { extractQuiz } = require('../lib/vision');

const ADMINS = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const SITE = require('../lib/site')();
const L = ['A', 'B', 'C', 'D'];
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pkToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
const short = qs => qs.map(x => L[x.a]).join(', ');
const answers = () => db().collection('answers');
const drafts = () => db().collection('drafts');
const getDraft = async uid => { const d = await drafts().doc(uid).get(); return d.exists ? d.data() : null; };
const saveDraft = (uid, x) => drafts().doc(uid).set({ ...x, updatedAt: FieldValue.serverTimestamp() });
const newDraft = (date, reward) => ({ date: date || pkToday(), reward: reward || '120MB', questions: [] });

const HELP = `<b>Telenor Quiz Bot</b>

<b>Tareeqa 1 - Step by step</b>
/new - shuru karein (ya /new 2026-11-24 120MB)
Phir sawal bhejein: pehli line sawal, neeche 4 options. Phir sahi jawab ka button dabayen.

<b>Tareeqa 2 - Screenshot</b>
Quiz ka screenshot bhejein, bot sawal parh lega. Phir sahi jawab ka button dabayen.

<b>Tareeqa 3 - Poora ek message</b>
Sab 5 sawal ek saath paste karein:
<code>1. Which planet is known as the Red Planet?
A) Earth
B) Mars
C) Venus
D) Jupiter
... (5 sawal)
SHORT ANSWERS: B, C, D, A, B</code>
Date/reward optional: pehli line <code>2026-11-25 150MB</code>. SHORT ANSWERS na hon to bot buttons se poochega.

/undo - aakhri sawal hatayen
/cancel - draft khatam
/today - aaj ka data
/list - aakhri 7 din
/delete 2026-11-24
/id - apna Telegram ID`;

async function next(chat, uid, dr) {
  const i = dr.questions.findIndex(x => x.a == null);
  if (i >= 0) {
    const x = dr.questions[i];
    const kb = { inline_keyboard: [x.o.map((_, j) => ({ text: L[j], callback_data: 'a:' + i + ':' + j }))] };
    return send(chat, '<b>Sawal ' + (i + 1) + '/5</b>\n' + esc(x.q) + '\n' + x.o.map((t, j) => L[j] + ') ' + esc(t)).join('\n') + '\n\nSahi jawab kaunsa?', kb);
  }
  if (dr.questions.length < 5) return send(chat, 'Sawal ' + (dr.questions.length + 1) + '/5 bhejein: text (sawal + 4 options) ya screenshot.');
  await answers().doc(dr.date).set({ date: dr.date, reward: dr.reward, questions: dr.questions, updatedAt: FieldValue.serverTimestamp() });
  await drafts().doc(uid).delete();
  return send(chat, '✅ Save ho gaya: <b>' + dr.date + '</b> (' + esc(dr.reward) + ')\nSHORT ANSWERS: <b>' + short(dr.questions) + '</b>' + (SITE ? '\n' + esc(SITE) : ''));
}

function addQs(dr, qs) {
  let skipped = 0;
  for (const q of qs) { if (dr.questions.length < 5) dr.questions.push(q); else skipped++; }
  return skipped;
}

async function ingestBlock(chat, uid, text) {
  const data = parseBlock(text, pkToday());
  const dr = { date: data.date, reward: data.reward, questions: data.questions };
  await saveDraft(uid, dr);
  return next(chat, uid, dr);
}

async function onCallback(cb) {
  const uid = String(cb.from.id), chat = cb.message.chat.id;
  if (!ADMINS.includes(uid)) return answerCb(cb.id, 'Access nahi');
  const m = /^a:(\d+):([0-3])$/.exec(cb.data || '');
  const dr = m && await getDraft(uid);
  if (!dr || !dr.questions[+m[1]]) return answerCb(cb.id, 'Draft nahi mila, /new se shuru karein');
  dr.questions[+m[1]].a = +m[2];
  await saveDraft(uid, dr);
  await answerCb(cb.id, '✅ ' + L[+m[2]]);
  await clearKb(chat, cb.message.message_id);
  await next(chat, uid, dr);
}

async function onMessage(msg) {
  const chat = msg.chat.id, uid = String(msg.from.id);
  const text = msg.text || msg.caption || '';
  const cmd = text.startsWith('/') ? text.split(/\s/)[0].split('@')[0].toLowerCase() : '';
  if (cmd === '/id') return send(chat, 'Aap ka ID: <code>' + uid + '</code>');
  if (!ADMINS.includes(uid)) return send(chat, 'Access nahi hai. Aap ka ID: <code>' + uid + '</code>');

  const imgMime = msg.photo ? 'image/jpeg' : (msg.document && /^image\/(jpeg|png|webp|gif)$/.test(msg.document.mime_type || '') ? msg.document.mime_type : '');
  if (imgMime) {
    if (!process.env.ANTHROPIC_API_KEY) return send(chat, 'Screenshot ke liye ANTHROPIC_API_KEY set karein.');
    const dr = (await getDraft(uid)) || newDraft();
    await send(chat, '🔍 Screenshot parh raha hoon...');
    const id = msg.photo ? msg.photo[msg.photo.length - 1].file_id : msg.document.file_id;
    const qs = await extractQuiz(await fileB64(id), imgMime);
    if (!qs.length) return send(chat, 'Screenshot mein sawal nahi mila. Saaf screenshot bhejein ya text mein likhein.');
    const skipped = addQs(dr, qs);
    await saveDraft(uid, dr);
    await send(chat, '📸 ' + qs.length + ' sawal mile' + (skipped ? ' (' + skipped + ' extra chhor diye, 5 se zyada nahi)' : ''));
    return next(chat, uid, dr);
  }

  if (cmd === '/start' || cmd === '/help') return send(chat, HELP);
  if (cmd === '/new') {
    const d = (text.match(/\d{4}-\d{2}-\d{2}/) || [])[0], r = text.match(/(\d+)\s*(mb|gb)/i);
    const dr = newDraft(d, r && r[1] + r[2].toUpperCase());
    await saveDraft(uid, dr);
    await send(chat, 'Naya draft: <b>' + dr.date + '</b> (' + dr.reward + ')');
    return next(chat, uid, dr);
  }
  if (cmd === '/cancel') { await drafts().doc(uid).delete(); return send(chat, 'Draft khatam.'); }
  if (cmd === '/undo') {
    const dr = await getDraft(uid);
    if (!dr || !dr.questions.length) return send(chat, 'Hatane ke liye kuch nahi.');
    dr.questions.pop(); await saveDraft(uid, dr);
    await send(chat, 'Aakhri sawal hata diya.');
    return next(chat, uid, dr);
  }
  if (cmd === '/answers') {
    if (looksLikeBlock(text)) return ingestBlock(chat, uid, text);
    const data = parseAnswers(text, pkToday());
    await answers().doc(data.date).set({ ...data, updatedAt: FieldValue.serverTimestamp() });
    return send(chat, '✅ Save ho gaya: <b>' + data.date + '</b> (' + esc(data.reward) + ')\nShort answer: <b>' + short(data.questions) + '</b>' + (SITE ? '\n' + esc(SITE) : ''));
  }
  if (cmd === '/today') {
    const d = await answers().doc(pkToday()).get();
    return send(chat, d.exists ? 'Aaj: <b>' + short(d.data().questions) + '</b> (' + esc(d.data().reward) + ')' : 'Aaj ka data abhi nahi daala.');
  }
  if (cmd === '/list') {
    const s = await answers().orderBy('date', 'desc').limit(7).get();
    return send(chat, s.empty ? 'Koi data nahi.' : s.docs.map(d => d.id + ': ' + short(d.data().questions)).join('\n'));
  }
  if (cmd === '/delete') {
    const date = (text.match(/\d{4}-\d{2}-\d{2}/) || [])[0];
    if (!date) return send(chat, 'Format: /delete 2026-11-24');
    await answers().doc(date).delete();
    return send(chat, '🗑 Hata diya: ' + date);
  }
  if (cmd) return send(chat, HELP);

  if (looksLikeBlock(text)) return ingestBlock(chat, uid, text);
  const dr = await getDraft(uid);
  if (!dr) return send(chat, HELP);
  addQs(dr, [parseOne(text)]);
  await saveDraft(uid, dr);
  return next(chat, uid, dr);
}

module.exports = async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).end();
  const u = req.body || {};
  const chat = (u.message && u.message.chat.id) || (u.callback_query && u.callback_query.message.chat.id);
  try {
    if (u.callback_query) await onCallback(u.callback_query);
    else if (u.message) await onMessage(u.message);
  } catch (e) {
    console.error(e);
    if (chat) await send(chat, '❌ ' + esc(e.message)).catch(() => {});
  }
  res.status(200).end();
};
