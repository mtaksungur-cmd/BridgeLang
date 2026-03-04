// Temporary script to call prod API with redirect following
const https = require('https');

const payload = JSON.stringify({ teacherName: "Mehmet T." });

function makeRequest(url) {
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 307 || res.statusCode === 308 || res.statusCode === 301 || res.statusCode === 302) {
      console.log(`Redirect ${res.statusCode} -> ${res.headers.location}`);
      makeRequest(res.headers.location);
      return;
    }
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try { console.log('Response:', JSON.parse(body)); } catch { console.log('Response:', body); }
    });
  });

  req.on('error', (e) => console.error('Error:', e.message));
  req.write(payload);
  req.end();
}

makeRequest('https://bridgelang.co.uk/api/admin/fix-teacher-availability');
