const https = require('https');

const options = {
  hostname: 'v3.football.api-sports.io',
  path: '/fixtures?live=all',
  method: 'GET',
  headers: {
    'x-rapidapi-key': '56200c0bdfaa4c5a82f724ead21ad14f',
    'x-rapidapi-host': 'v3.football.api-sports.io'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Total live matches:', json.results);
    
    if (json.response && json.response.length > 0) {
      const afcon = json.response.filter(m => m.league.id === 6);
      console.log('AFCON live matches:', afcon.length);
      afcon.forEach(m => {
        console.log(`${m.teams.home.name} ${m.goals.home} - ${m.goals.away} ${m.teams.away.name} | ${m.fixture.status.short}`);
      });
    } else {
      console.log('No live matches right now');
    }
  });
});
req.on('error', e => console.error(e));
req.end();
