const ALLOWED = new Set(['E0','E1','E2','E3','EC','SC0','SC1','SC2','SC3','D1','D2','I1','I2','SP1','SP2','F1','F2','N1','B1','P1','T1','G1']);

function seasonCodes() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const curStart = m < 7 ? y - 1 : y;
  return [curStart, curStart - 1].map(s => `${String(s).slice(-2)}${String(s + 1).slice(-2)}`);
}

exports.handler = async (event) => {
  const league = (event.queryStringParameters?.league || '').toUpperCase();
  if (!ALLOWED.has(league)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Liga tidak diizinkan' }) };
  }
  for (const season of seasonCodes()) {
    const url = `https://www.football-data.co.uk/mmz4281/${season}/${league}.csv`;
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const text = await r.text();
      
      // --- TAMBAHAN BARU: Jika data musim ini kurang dari 100 laga, coba musim lalu ---
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 100) continue; 
      // --------------------------------------------------------------------------------

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Cache-Control': 'public, max-age=21600',
          'Access-Control-Allow-Origin': '*',
        },
        body: text,
      };
    } catch (_) {}
  }
  return { statusCode: 404, body: JSON.stringify({ error: 'CSV tidak ditemukan' }) };
};
