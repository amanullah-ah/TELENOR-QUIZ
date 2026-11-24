const siteUrl = require('../lib/site');

module.exports = (req, res) => {
  const site = siteUrl();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600');
  res.status(200).send('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /lib/\n\nSitemap: ' + site + '/sitemap.xml\n');
};
