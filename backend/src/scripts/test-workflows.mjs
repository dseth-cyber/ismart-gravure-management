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
  console.log('\n=== Test Workflow API ===\n');

  const login = await req('POST', '/api/v1/auth/login', { username: 'admin', password: 'Password123!' });
  const at = login.d?.data?.accessToken;
  console.log('1. Login:', login.s, 'Token:', !!at);

  if (!at) { console.log('FAILED'); return; }

  // 2. List workflow definitions
  const defs = await req('GET', '/api/v1/workflows/definitions', null, at);
  console.log('2. Definitions:', defs.s, 'Count:', defs.d?.data?.length);

  const defId = defs.d?.data?.[0]?.id;
  console.log('   First def ID:', defId?.substring(0, 8) + '...');

  // 3. Start a workflow instance
  const start = await req('POST', '/api/v1/workflows/instances', {
    defId,
    title: 'Test Leave Request - John',
    refType: 'leave_request',
    refId: 'EMP-001',
    metadata: { reason: 'Sick leave', days: 3 },
  }, at);
  console.log('3. Start instance:', start.s, 'Status:', start.d?.data?.status, 'Steps:', start.d?.data?.steps?.length);

  const instId = start.d?.data?.id;

  // 4. List instances
  const list = await req('GET', '/api/v1/workflows/instances', null, at);
  console.log('4. List instances:', list.s, 'Total:', list.d?.data?.total);

  // 5. Get pending approvals
  const pending = await req('GET', '/api/v1/workflows/pending', null, at);
  console.log('5. Pending approvals:', pending.s, 'Count:', pending.d?.data?.length);

  // 6. Approve first step
  if (instId) {
    const approve = await req('POST', `/api/v1/workflows/instances/${instId}/approve`, { comment: 'Approved - looks good' }, at);
    console.log('6. Approve step 1:', approve.s, 'Status:', approve.d?.data?.status, 'Step:', approve.d?.data?.currentStep);
  }

  // 7. Approve second step
  if (instId) {
    const approve2 = await req('POST', `/api/v1/workflows/instances/${instId}/approve`, {}, at);
    console.log('7. Approve step 2:', approve2.s, 'Status:', approve2.d?.data?.status);
  }

  // 8. Test reject flow
  const start2 = await req('POST', '/api/v1/workflows/instances', {
    defId,
    title: 'Test Reject Flow',
    refType: 'leave_request',
    refId: 'EMP-002',
  }, at);
  const instId2 = start2.d?.data?.id;
  console.log('8. Start reject test:', start2.s, 'Status:', start2.d?.data?.status);

  if (instId2) {
    const reject = await req('POST', `/api/v1/workflows/instances/${instId2}/reject`, { comment: 'Not enough leave balance' }, at);
    console.log('9. Reject:', reject.s, 'Status:', reject.d?.data?.status);
  }

  console.log('\n=== DONE ===');
}

main().catch(console.error);
