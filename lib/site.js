// Website ka asli domain. Custom domain lagayen to Vercel mein SITE_URL set karein (ya yahan badal dein).
const DEFAULT_SITE = 'https://telenor-quizanswer.vercel.app';
module.exports = () => (process.env.SITE_URL || DEFAULT_SITE).replace(/\/+$/, '');
