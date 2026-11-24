const PROMPT = `This is a screenshot of a Telenor "Test Your Skills" quiz. Extract every question visible, each with exactly its 4 answer options in the order shown.
Reply ONLY with JSON: [{"q":"question text","o":["opt1","opt2","opt3","opt4"]}]
Do NOT guess the correct answer. Only if the screenshot clearly marks the correct option (green highlight/tick after answering), add "a": index 0-3.
If no question with 4 options is visible, reply [].`;

async function extractQuiz(b64, type) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: type, data: b64 } },
        { type: 'text', text: PROMPT }
      ] }]
    })
  });
  const j = await r.json();
  if (!r.ok) throw new Error('AI error: ' + ((j.error && j.error.message) || r.status));
  const t = (j.content || []).map(c => c.text || '').join('');
  const m = t.match(/\[[\s\S]*\]/);
  if (!m) return [];
  return JSON.parse(m[0])
    .filter(x => x && x.q && Array.isArray(x.o) && x.o.length === 4)
    .map(x => ({ q: String(x.q).trim(), o: x.o.map(s => String(s).trim()), a: Number.isInteger(x.a) && x.a >= 0 && x.a < 4 ? x.a : null }));
}

module.exports = { extractQuiz };
