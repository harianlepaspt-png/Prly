const ALLOWED = new Set(['E0','E1','E2','E3','EC','SC0','SC1','SC2','SC3','D1','D2','I1','I2','SP1','SP2','F1','F2','N1','B1','P1','T1','G1']);

function seasonCodes() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const curStart = m < 7 ? y - 1 : y;
  return [curStart, curStart - 1].map(s => `${String(s).slice(-2)}${String(s + 1).slice(-2)}`);
}

module.exports = async (req, res) => {
  const league = (req.query.league || '').toUpperCase();
  if (!ALLOWED.has(league)) {
    return res.status(400).json({ error: 'Liga tidak diizinkan' });
  }

  const seasons = seasonCodes();
  
  const texts = await Promise.all(seasons.map(async season => {
    const url = `https://www.football-data.co.uk/mmz4281/${season}/${league}.csv`;
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
      });
      if (!r.ok) return null;
      return await r.text();
    } catch (_) { return null; }
  }));

  let header = '';
  const lines = [];
  for (const text of texts) {
    if (!text) continue;
    const l = text.trim().split(/\r?\n/);
    if (l.length < 2) continue;
    if (!header) header = l[0];
    lines.push(...l.slice(1));
  }

  if (lines.length === 0) {
    return res.status(404).json({ error: 'CSV tidak ditemukan' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=21600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).send(header + '\n' + lines.join('\n'));
};
