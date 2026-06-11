import http from 'http';

function req(method, path, body, headers = {}) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 5000, path, method, headers: { 'Content-Type': 'application/json', ...headers } };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data || '{}'), headers: res.headers }));
    });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  let r = await req('POST', '/api/v1/auth/mfa/verify', { tempToken: 'abc', code: '123' });
  console.log('1. MFA verify short code:', r.status);

  r = await req('POST', '/api/v1/auth/mfa/verify', { tempToken: '', code: '' });
  console.log('2. MFA verify empty:', r.status, (r.body.message || '').includes('required') ? 'OK' : 'FAIL');

  const login = await req('POST', '/api/v1/auth/login', { username: 'admin', password: 'Password123!' });
  const token = login.body.data?.accessToken || '';
  const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  r = await req('POST', '/api/v1/auth/change-password', { currentPassword: 'old', newPassword: 'short' }, authHeaders);
  console.log('3. Change pwd short:', r.status, (r.body.message || '').includes('8') ? 'OK' : 'FAIL');

  r = await req('POST', '/api/v1/auth/change-password', { currentPassword: 'Password123!', newPassword: 'NewPassword123!' }, authHeaders);
  console.log('4. Change pwd valid:', r.status, r.body.message || '');

  r = await req('POST', '/api/v1/auth/refresh', {});
  console.log('5. Refresh no token:', r.status, r.body.message || '');

  r = await req('GET', '/api/v1/permissions', undefined, { 'Authorization': 'Bearer ' + token });
  console.log('6. Perms no API key:', r.status, r.body.message || '');

  r = await req('GET', '/api/v1/permissions', undefined, { 'Authorization': 'Bearer ' + token, 'X-API-Key': 'wrong' });
  console.log('7. Perms wrong API key:', r.status, r.body.message || '');

  r = await req('GET', '/api/v1/permissions', undefined, { 'Authorization': 'Bearer ' + token, 'X-API-Key': 'test-api-key-123' });
  console.log('8. Perms correct API key:', r.status, r.body.data?.length === 50 ? 'OK' : 'FAIL');

  console.log('=== DONE ===');
}
main().catch(e => { console.error(e); process.exit(1); });
