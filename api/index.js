const fs = require('fs');
const path = require('path');
const { getDays } = require('../lib/days');
const siteUrl = require('../lib/site');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const safeJson = o => JSON.stringify(o).replace(/</g, '\\u003c');
const pretty = d => { const p = d.split('-'); return +p[2] + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0]; };
const FAQ = [
  ['Are the answers 100% correct?', 'We check the app’s questions every day and update the answers. Questions can sometimes differ by SIM or region.'],
  ['My app shows different questions. What now?', 'Copy the question into an AI tool, or wait for the next update.'],
  ['When are answers updated?', 'The quiz changes at 12:00 AM, and the answers appear here a few minutes later.'],
  ['Can I play on Wi-Fi?', 'Yes. After the first login/OTP, both Wi-Fi and mobile data work.']
];
let tpl;

module.exports = async (req, res) => {
  tpl = tpl || fs.readFileSync(path.join(process.cwd(), 'lib', 'template.html'), 'utf8');
  const site = siteUrl();
  let days = [];
  try { days = await getDays(7); } catch (e) { console.error(e); }
  const top = days[0];
  const letters = top ? top.questions.map(q => 'ABCD'[q.a]).join(', ') : '';

  const title = top ? 'Telenor Quiz Today Answers – ' + pretty(top.date) + ' | AMAN ULLAH' : 'Telenor Quiz Today Answers | AMAN ULLAH';
  const desc = top
    ? 'Telenor Quiz answers for ' + pretty(top.date) + ': ' + letters + '. Win ' + top.reward + ' free in the My Telenor app. Updated daily after 12 AM PKT.'
    : 'Daily My Telenor app quiz answers, updated every day after midnight (PKT). Check the answers and win free MBs.';
  const img = site + '/og-image.png';

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': site + '/#site', url: site + '/', name: 'Telenor Quiz Today Answers', inLanguage: ['en', 'ur'], publisher: { '@type': 'Person', name: 'AMAN ULLAH' } },
      { '@type': 'WebPage', '@id': site + '/#page', url: site + '/', name: title, description: desc, isPartOf: { '@id': site + '/#site' }, ...(top ? { dateModified: top.date } : {}) },
      { '@type': 'FAQPage', mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }
    ]
  };

  const head = [
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(desc) + '">',
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    '<link rel="canonical" href="' + esc(site) + '/">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Telenor Quiz Today Answers">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:url" content="' + esc(site) + '/">',
    '<meta property="og:image" content="' + esc(img) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Telenor Quiz Today Answers">',
    '<meta property="og:locale" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(desc) + '">',
    '<meta name="twitter:image" content="' + esc(img) + '">',
    '<script type="application/ld+json">' + safeJson(ld) + '</script>'
  ].join('\n');

  const noscript = top
    ? '<noscript><section><h2>Telenor Quiz answers – ' + esc(pretty(top.date)) + '</h2><ol>' +
      top.questions.map(q => '<li>' + esc(q.q) + ' <strong>' + 'ABCD'[q.a] + ') ' + esc(q.o[q.a]) + '</strong></li>').join('') +
      '</ol><p>Short answers: ' + letters + '</p></section></noscript>'
    : '<noscript><p>Please enable JavaScript to see today’s Telenor Quiz answers.</p></noscript>';

  const html = tpl
    .replace('<!--{{HEAD}}-->', () => head)
    .replace('/*{{DAYS_JSON}}*/[]', () => safeJson(days))
    .replace('<!--{{NOSCRIPT}}-->', () => noscript);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
};
