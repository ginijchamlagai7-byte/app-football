import http from 'http';

function testGet() {
  http.get('http://localhost:3000/api/broadcast-state?user=admin', (res) => {
    console.log('GET Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('GET Response length:', data.length);
      try {
        const json = JSON.parse(data);
        console.log('GET Response success:', json.success);
      } catch (e) {
        console.log('GET JSON Parse error:', e.message);
      }
    });
  }).on('error', (err) => {
    console.error('GET Request error:', err.message);
  });
}

function testPost() {
  const payload = JSON.stringify({ user: 'admin', state: { matchInfo: { tournamentName: 'Test' } } });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/broadcast-state',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  const req = http.request(options, (res) => {
    console.log('POST Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('POST Response:', data);
    });
  });

  req.on('error', (err) => {
    console.error('POST Request error:', err.message);
  });

  req.write(payload);
  req.end();
}

testGet();
setTimeout(testPost, 1000);
