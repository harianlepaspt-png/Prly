// api/fetch-ucl.js
module.exports = async (req, res) => {
  const API_KEY = process.env.FOOTBALL_DATA_KEY || 'aab93ef829e04e55863130042754890a';
  const url = 'https://api.football-data.org/v4/competitions/CL/matches?status=FINISHED';

  try {
    const response = await fetch(url, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gagal ambil data UCL', detail: errText });
    }

    const data = await response.json();
    const matches = data.matches.filter(m => 
      m.score && m.score.fullTime && 
      m.score.fullTime.home !== null && 
      m.score.fullTime.away !== null
    );

    if (matches.length === 0) {
      return res.status(404).json({ error: 'Belum ada data pertandingan UCL' });
    }

    let csv = 'Div,Date,HomeTeam,AwayTeam,FTHG,FTAG\n';
    matches.forEach(m => {
      const home = m.homeTeam.name || m.homeTeam.shortName;
      const away = m.awayTeam.name || m.awayTeam.shortName;
      const fthg = m.score.fullTime.home;
      const ftag = m.score.fullTime.away;
      const date = m.utcDate.split('T')[0];
      const safeHome = home.replace(/,/g, '');
      const safeAway = away.replace(/,/g, '');
      csv += `UCL,${date},${safeHome},${safeAway},${fthg},${ftag}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(csv);

  } catch (error) {
    return res.status(500).json({ error: 'Server Error', detail: error.message });
  }
};
