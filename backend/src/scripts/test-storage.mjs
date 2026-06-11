const BASE = 'http://localhost:5000/api/v1/storage';
const AUTH_BASE = 'http://localhost:5000/api/v1/auth';
let token = '';
let fileId = '';

async function login() {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Password123!' }),
  });
  const data = await res.json();
  token = data.data?.accessToken || data.accessToken;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(data));
  console.log('✓ Logged in, got token');
}

async function uploadFile() {
  const boundary = '----TestBoundary' + Date.now();
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="file"; filename="test.txt"',
    'Content-Type: text/plain',
    '',
    'Hello from E2E storage test!',
    `--${boundary}`,
    'Content-Disposition: form-data; name="entityType"',
    '',
    'test',
    `--${boundary}`,
    'Content-Disposition: form-data; name="entityId"',
    '',
    'e2e-test',
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  const data = await res.json();
  console.log('Upload status:', res.status, data.status);
  if (res.status !== 201) throw new Error('Upload failed: ' + JSON.stringify(data));
  fileId = data.data?.id;
  if (!fileId) throw new Error('No file ID returned');
  console.log('✓ File uploaded, id:', fileId);
}

async function listFiles() {
  const res = await fetch(`${BASE}/files?entityType=test`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.status !== 200 || !data.data?.files?.length) throw new Error('List failed: ' + JSON.stringify(data));
  console.log(`✓ Listed ${data.data.files.length} files`);
}

async function downloadFile() {
  const res = await fetch(`${BASE}/files/${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error('Download failed: ' + res.status);
  const text = await res.text();
  if (!text.includes('Hello from E2E')) throw new Error('Content mismatch');
  console.log('✓ File downloaded, content matches');
}

async function getSignedUrl() {
  const res = await fetch(`${BASE}/files/${fileId}/url`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.status !== 200 || !data.data?.url) throw new Error('Signed URL failed: ' + JSON.stringify(data));
  console.log('✓ Signed URL obtained');
}

async function deleteFile() {
  const res = await fetch(`${BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error('Delete failed: ' + JSON.stringify(data));
  console.log('✓ File deleted');
}

async function run() {
  console.log('Storage E2E Tests\n');
  try {
    await login();
    await uploadFile();
    await listFiles();
    await downloadFile();
    await getSignedUrl();
    await deleteFile();
    console.log('\n✓ All storage E2E tests passed!');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
  }
}

run();
