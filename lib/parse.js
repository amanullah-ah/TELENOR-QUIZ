// Message format:
// /answers [YYYY-MM-DD] [120MB]
// 1. Question | Option A | Option B | Option C | Option D | Answer
// (Answer = 1-4, A-D, ya sahi option ka text)

function parseAnswers(text, today) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const head = lines.shift() || '';
  const h = head.split(/\s+/).slice(1).join(' ');
  const d = h.match(/\d{4}-\d{2}-\d{2}/);
  const r = h.match(/(\d+)\s*(mb|gb)/i);
  const date = d ? d[0] : today;
  const reward = r ? r[1] + r[2].toUpperCase() : '120MB';
  if (isNaN(new Date(date + 'T00:00:00Z'))) throw new Error('Date galat hai: ' + date);

  const questions = lines.map((line, i) => {
    const body = line.replace(/^(?:q\s*)?\d+\s*[.):\-]\s*/i, '');
    const p = body.split('|').map(s => s.trim());
    if (p.length !== 6) throw new Error('Line ' + (i + 1) + ': 6 hisse chahiye (sawal | 4 options | jawab)');
    const q = p[0], o = p.slice(1, 5), ans = p[5];
    if (!q || o.some(x => !x)) throw new Error('Line ' + (i + 1) + ': sawal ya option khali hai');
    let a;
    if (/^[1-4]$/.test(ans)) a = +ans - 1;
    else if (/^[a-d]$/i.test(ans)) a = ans.toUpperCase().charCodeAt(0) - 65;
    else a = o.findIndex(x => x.toLowerCase() === ans.toLowerCase());
    if (a < 0) throw new Error('Line ' + (i + 1) + ': jawab options se match nahi hua');
    return { q, o, a };
  });
  if (questions.length !== 5) throw new Error('5 sawal chahiye, ' + questions.length + ' mile');
  return { date, reward, questions };
}

// Ek sawal: 5 lines (sawal + 4 options) ya "sawal | o1 | o2 | o3 | o4"
function parseOne(text) {
  const p = (text.includes('|') ? text.split('|') : text.split('\n')).map(s => s.trim()).filter(Boolean);
  if (p.length !== 5) throw new Error('Sawal + 4 options chahiye (5 lines, ya | se alag)');
  const q = p[0].replace(/^(?:q\s*)?\d+\s*[.):\-]\s*/i, '');
  const o = p.slice(1).map(x => x.replace(/^\(?[A-Da-d1-4][.):]\s+/, ''));
  return { q, o, a: null };
}

// Block format (copy-paste friendly):
// 1. Question
// A) opt  B) opt  C) opt  D) opt   (har option nayi line mein)
// ... 5 sawal ...
// SHORT ANSWERS: B, C, D, A, B
function looksLikeBlock(t) {
  return (t.match(/^\s*\**\d{1,2}\s*[.):]\s*\S/gm) || []).length >= 2 && /^\s*\(?[Aa]\s*[.):]\s+\S/m.test(t);
}

function parseBlock(raw, today) {
  const lines = raw.replace(/[*`]/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  const Q = /^(\d{1,2})\s*[.):\-]\s*(.+)$/, O = /^\(?([A-Da-d])\s*[.):]\s*(.+)$/, S = /short\s*answers?\s*[:\-]?\s*(.*)$/i;
  const header = [], qs = [];
  let cur = null, shortLine = null;
  for (const l of lines) {
    const s = l.match(S);
    if (s) { shortLine = s[1]; cur = null; continue; }
    const q = l.match(Q);
    if (q) { cur = { q: q[2].trim(), o: [], a: null }; qs.push(cur); continue; }
    const o = l.match(O);
    if (o && cur) { cur.o.push(o[2].trim()); continue; }
    if (!cur) { header.push(l); continue; }
    if (cur.o.length) cur.o[cur.o.length - 1] += ' ' + l; else cur.q += ' ' + l;
  }
  const h = header.join(' ');
  const d = h.match(/\d{4}-\d{2}-\d{2}/), r = h.match(/(\d+)\s*(mb|gb)/i);
  const date = d ? d[0] : today, reward = r ? r[1] + r[2].toUpperCase() : '120MB';
  if (isNaN(new Date(date + 'T00:00:00Z'))) throw new Error('Date galat hai: ' + date);
  if (qs.length !== 5) throw new Error('5 sawal chahiye, ' + qs.length + ' mile');
  qs.forEach((x, i) => { if (x.o.length !== 4) throw new Error('Sawal ' + (i + 1) + ': 4 options (A-D) chahiye, ' + x.o.length + ' mile'); });
  if (shortLine !== null) {
    const L = shortLine.split(/[\s,;]+/).map(t => t.replace(/^\d+[.):\-]?/, '').replace(/[().]/g, '')).filter(t => /^[A-Da-d]$/.test(t));
    if (L.length !== 5) throw new Error('SHORT ANSWERS mein 5 jawab chahiye, ' + L.length + ' mile');
    L.forEach((c, i) => { qs[i].a = c.toUpperCase().charCodeAt(0) - 65; });
  }
  return { date, reward, questions: qs };
}

module.exports = { parseAnswers, parseOne, parseBlock, looksLikeBlock };
