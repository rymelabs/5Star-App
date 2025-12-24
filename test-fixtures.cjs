const https = require('https');

// Check for recent AFCON fixtures
const options = {
  hostname: 'v3.football.api-sports.io',
  path: '/fixtures?league=6&season=2025&from=2025-12-21&to=2025-12-24',
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
    console.log('API Response:', JSON.stringify(json, null, 2));
  });
});
req.on('error', e => console.error(e));
req.end();
