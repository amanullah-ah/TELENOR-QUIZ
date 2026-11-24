const { db } = require('./firebase');

async function getDays(n) {
  const snap = await db().collection('answers').orderBy('date', 'desc').limit(n || 7).get();
  return snap.docs.map(d => {
    const x = d.data();
    return { date: x.date, reward: x.reward, questions: x.questions };
  });
}

module.exports = { getDays };
