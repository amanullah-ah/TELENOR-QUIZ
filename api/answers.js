const { getDays } = require('../lib/days');

module.exports = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(await getDays(7));
  } catch (e) {
    console.error(e);
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ error: 'server error' });
  }
};
