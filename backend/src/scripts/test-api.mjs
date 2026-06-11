import http from 'http';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 5000, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    r.on('error', e => resolve({ status: 0, data: { message: e.message } }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  console.log('\n=== Test MFA API Flow ===\n');

  // Login with correct seed password
  const login = await req('POST', '/api/v1/auth/login', { username: 'admin', password: 'Password123!' });
  console.log('1. Login:', login.status);
  
  if (login.data?.data?.accessToken) {
    const at = login.data.data.accessToken;
    console.log('   Token:', at.substring(0, 20) + '...');
    console.log('   User:', login.data.data.user?.username, '-', login.data.data.user?.role);
    
    const gen = await req('POST', '/api/v1/auth/mfa/generate', {}, at);
    console.log('2. MFA Generate:', gen.status);
    if (gen.data?.data) {
      console.log('   Secret:', gen.data.data.secret?.substring(0, 16) + '...');
      console.log('   URI:', gen.data.data.uri?.substring(0, 40) + '...');
    }

    const status = await req('GET', '/api/v1/auth/mfa/status', null, at);
    console.log('3. MFA Status:', status.status);
    if (status.data?.data) {
      console.log('   mfaEnabled:', status.data.data.mfaEnabled);
      console.log('   hasSecret:', status.data.data.hasSecret);
    }

    // Test logout
    const refreshToken = login.data.data.refreshToken;
    const logout = await req('POST', '/api/v1/auth/logout', { refreshToken }, at);
    console.log('4. Logout:', logout.status, logout.data?.message);
  } else {
    console.log('   Response:', JSON.stringify(login.data));
  }

  console.log('\n=== Done ===\n');
}

main().catch(console.error);
