const fs = require('fs');
const https = require('https');

const req = https.request('https://font-api-0dqe.onrender.com/convert', { method: 'OPTIONS' }, (res) => {
  console.log('StatusCode:', res.statusCode);
  console.log('Headers:', res.headers);
});
req.on('error', (e) => {
  console.error('Error:', e.message);
});
req.end();
