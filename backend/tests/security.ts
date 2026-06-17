const API_BASE = process.env.API_URL || 'http://localhost:5000/api/v1';

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<boolean | string>): Promise<void> {
  try {
    const result = await fn();
    if (result === true) {
      console.log(`  ✓ ${name}`);
      passed++;
    } else {
      console.log(`  ✗ ${name}: ${result}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`  ✗ ${name}: ${err.message}`);
    failed++;
  }
}

async function api(
  method: string,
  path: string,
  body?: any,
  token?: string,
  apiKey?: string
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (apiKey) headers['X-API-Key'] = apiKey;
  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runSecurityTests(): Promise<void> {
  console.log('=============================================');
  console.log('   Security-Focused Tests');
  console.log('=============================================\n');

  // ── 1. Auth & Input Validation ──
  console.log('--- Auth & Input Validation ---');

  await test('Login rejects empty username', async () => {
    const res = await api('POST', '/auth/login', { username: '', password: 'test1234' });
    const json = await res.json();
    return res.status === 400 && json.status === 'error' || 'Expected 400 for empty username';
  });

  await test('Login rejects missing fields', async () => {
    const res = await api('POST', '/auth/login', {});
    const json = await res.json();
    return res.status === 400 && json.status === 'error' || 'Expected 400 for missing fields';
  });

  await test('Login rejects wrong password', async () => {
    const res = await api('POST', '/auth/login', { username: 'admin', password: 'wrongpassword123!' });
    return res.status === 401 || res.status === 400 || `Expected 401/400, got ${res.status}`;
  });

  await test('Forged JWT is rejected', async () => {
    const res = await api('GET', '/auth/me', undefined, 'eyJhbGciOiJIUzI1NiJ9.fake.invalid');
    return res.status === 401 || `Expected 401, got ${res.status}`;
  });

  await test('Empty JWT is rejected', async () => {
    const res = await api('GET', '/auth/me', undefined, '');
    return res.status === 401 || `Expected 401, got ${res.status}`;
  });

  // ── 2. Zod Validation ──
  console.log('\n--- Zod Input Validation ---');

  await test('XSS script tag in username is rejected or sanitized', async () => {
    const res = await api('POST', '/auth/login', { username: '<script>alert("xss")</script>', password: 'test1234' });
    const json = await res.json();
    // Should either reject or sanitize — either is acceptable
    return (res.status === 400 && json.status === 'error') || res.status === 401 || `Unexpected status ${res.status}`;
  });

  await test('Password change rejects short password', async () => {
    // Login first
    const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'admin1234!' });
    const loginJson = await loginRes.json();
    if (loginRes.status !== 200) return 'Login failed (test requires running seed)';

    const token = loginJson.data.accessToken;
    const res = await api('POST', '/auth/change-password',
      { currentPassword: 'admin1234!', newPassword: 'short' },
      token
    );
    return res.status === 400 || `Expected 400, got ${res.status}`;
  });

  // ── 3. Permission Enforcement ──
  console.log('\n--- RBAC & Permission Enforcement ---');

  await test('Unauthenticated request to /users returns 401', async () => {
    const res = await api('GET', '/auth/users');
    return res.status === 401 || `Expected 401, got ${res.status}`;
  });

  await test('Wrong HTTP method returns 404', async () => {
    const res = await api('PATCH', '/auth/login', {});
    return res.status === 404 || `Expected 404, got ${res.status}`;
  });

  await test('Health endpoint is public', async () => {
    const res = await api('GET', '/health');
    return res.status === 200 || `Expected 200, got ${res.status}`;
  });

  // ── 4. Security Headers ──
  console.log('\n--- Security Headers ---');

  await test('X-Frame-Options header is present', async () => {
    const res = await api('GET', '/health');
    const header = res.headers.get('x-frame-options') || res.headers.get('X-Frame-Options');
    return header === 'DENY' || `Expected DENY, got ${header}`;
  });

  await test('X-Content-Type-Options header is present', async () => {
    const res = await api('GET', '/health');
    const header = res.headers.get('x-content-type-options');
    return header === 'nosniff' || `Expected nosniff, got ${header}`;
  });

  await test('Content-Security-Policy header is present', async () => {
    const res = await api('GET', '/health');
    const header = res.headers.get('content-security-policy');
    return header !== null && header !== '' || 'CSP header missing';
  });

  await test('CSP does not contain unsafe-inline', async () => {
    const res = await api('GET', '/health');
    const header = res.headers.get('content-security-policy');
    return (header !== null && !header.includes("'unsafe-inline'")) || 'CSP still contains unsafe-inline';
  });

  await test('Strict-Transport-Security header is present', async () => {
    const res = await api('GET', '/health');
    const header = res.headers.get('strict-transport-security');
    return header !== null && header !== '' || 'HSTS header missing';
  });

  // ── 5. Rate Limiting ──
  console.log('\n--- Rate Limiting ---');

  await test('Rate limit headers present on success', async () => {
    const res = await api('GET', '/health');
    const limit = res.headers.get('x-ratelimit-limit');
    const remaining = res.headers.get('x-ratelimit-remaining');
    return (limit !== null && remaining !== null) || 'Rate limit headers missing';
  });

  // ── 6. CORS ──
  console.log('\n--- CORS Configuration ---');

  await test('CORS allows known origin', async () => {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { Origin: 'http://localhost:3000' },
    });
    const cors = res.headers.get('access-control-allow-origin');
    return cors === 'http://localhost:3000' || `Expected http://localhost:3000, got ${cors}`;
  });

  // ── 7. Audit Logging ──
  console.log('\n--- Audit Logging ---');

  await test('Failed login is logged to audit', async () => {
    // Trigger a failed login
    await api('POST', '/auth/login', { username: 'audittest_user', password: 'wrongpass!' });

    // Login as admin
    const loginRes = await api('POST', '/auth/login', { username: 'admin', password: 'admin1234!' });
    const loginJson = await loginRes.json();
    if (loginRes.status !== 200) return 'Admin login failed (test requires running seed)';
    const token = loginJson.data.accessToken;

    // Check audit log for the failed login
    const auditRes = await api('GET', '/audit?action=auth.login.failed&limit=5', undefined, token);
    const auditJson = await auditRes.json();
    if (auditRes.status !== 200) return 'Audit endpoint failed';
    const logs = auditJson.data?.logs || auditJson.data || [];
    return logs.length > 0 || 'Failed login not found in audit log';
  });

  // ── Summary ──
  console.log('\n=============================================');
  console.log(`   Results: ${passed} passed, ${failed} failed`);
  console.log('=============================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runSecurityTests().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
