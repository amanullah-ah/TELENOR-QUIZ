const { getDays } = require('../lib/days');
const siteUrl = require('../lib/site');

module.exports = async (req, res) => {
  const site = siteUrl();
  let last = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  try { const d = await getDays(1); if (d[0]) last = d[0].date; } catch (e) { console.error(e); }
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>' + site + '/</loc>\n    <lastmod>' + last + '</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n');
};
