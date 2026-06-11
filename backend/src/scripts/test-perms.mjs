import http from 'http';

function req(method, path, body, token, extraHeaders = {}) {
  return new Promise(resolve => {
    const opts = { hostname: 'localhost', port: 5000, path, method, headers: { 'Content-Type': 'application/json', 'X-API-Key': 'test-api-key-123', ...extraHeaders } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const h = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, d: JSON.parse(d) }); } catch { resolve({ s: res.statusCode, d }); } });
    });
    h.on('error', e => resolve({ s: 0, d: { message: e.message } }));
    if (body) h.write(JSON.stringify(body));
    h.end();
  });
}

async function main() {
  const l = await req('POST', '/api/v1/auth/login', { username: 'admin', password: 'Password123!' });
  const at = l.d?.data?.accessToken;
  console.log('1. Login:', l.s, 'Token:', !!at);

  if (at) {
    const p = await req('GET', '/api/v1/permissions', null, at);
    console.log('2. List permissions:', p.s, 'Count:', p.d?.data?.length);

    const c = await req('GET', '/api/v1/permissions/check?permission=jobs:create', null, at);
    console.log('3. Check permission:', c.s, 'Allowed:', c.d?.data?.allowed);

    const r = await req('GET', '/api/v1/permissions/roles/admin', null, at);
    console.log('4. Admin role perms:', r.s, 'Count:', r.d?.data?.length);

    // Test with viewer role
    const l2 = await req('POST', '/api/v1/auth/login', { username: 'viewer1', password: 'Password123!' });
    const at2 = l2.d?.data?.accessToken;
    console.log('5. Viewer login:', l2.s, 'Token:', !!at2);
    
    if (at2) {
      const c2 = await req('GET', '/api/v1/permissions/check?permission=jobs:create', null, at2);
      console.log('6. Viewer check jobs:create:', c2.s, 'Allowed:', c2.d?.data?.allowed);
      
      const c3 = await req('GET', '/api/v1/permissions/check?permission=customers:read', null, at2);
      console.log('7. Viewer check customers:read:', c3.s, 'Allowed:', c3.d?.data?.allowed);
    }
  }
  console.log('\n=== DONE ===');
}

main().catch(console.error);
