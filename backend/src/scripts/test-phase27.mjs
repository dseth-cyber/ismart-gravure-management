const AUTH_BASE = 'http://localhost:5000/api/v1/auth';
const AI_BASE = 'http://localhost:5000/api/v1/ai';
const IOT_BASE = 'http://localhost:5000/api/v1/iot';
let token = '';

async function login() {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Password123!' }),
  });
  const data = await res.json();
  token = data.data?.accessToken || data.accessToken;
  if (!token) throw new Error('Login failed');
  console.log('✓ Logged in');
}

// ─── AI Gateway Tests ──────────────────────────────────────────────
async function testAiGateway() {
  console.log('\n── AI Gateway ──');

  // Create a provider (Ollama — works without API key)
  let res = await fetch(`${AI_BASE}/providers`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Local Ollama ' + Date.now(),
      providerType: 'ollama',
      modelName: 'llama3',
      baseUrl: 'http://ollama:11434',
      isActive: true,
    }),
  });
  let data = await res.json();
  if (res.status !== 200) throw new Error('Create provider failed: ' + JSON.stringify(data));
  const providerId = data.data?.id;
  console.log('✓ Provider created');

  // List providers
  res = await fetch(`${AI_BASE}/providers`, { headers: { 'Authorization': `Bearer ${token}` } });
  data = await res.json();
  if (res.status !== 200 || !data.data?.length) throw new Error('List providers failed');
  console.log('✓ Providers listed');

  // Create prompt template
  res = await fetch(`${AI_BASE}/templates`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'translate',
      prompt: 'Translate the following to {{language}}: {{text}}',
      variables: ['language', 'text'],
      language: 'en',
    }),
  });
  data = await res.json();
  if (res.status !== 200) throw new Error('Create template failed: ' + JSON.stringify(data));
  const templateId = data.data?.id;
  console.log('✓ Prompt template created');

  // Render template
  res = await fetch(`${AI_BASE}/templates/render`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId,
      variables: { language: 'Thai', text: 'Hello, world!' },
    }),
  });
  data = await res.json();
  if (res.status !== 200 || !data.data?.rendered.includes('Thai')) throw new Error('Render template failed');
  console.log('✓ Template rendered');

  // List templates
  res = await fetch(`${AI_BASE}/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
  data = await res.json();
  if (res.status !== 200 || !data.data?.length) throw new Error('List templates failed');
  console.log('✓ Templates listed');

  // Chat completion (will fail gracefully since Ollama may not be running)
  res = await fetch(`${AI_BASE}/chat`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId,
      prompt: 'Hello, what is 2+2?',
      maxTokens: 100,
    }),
  });
  data = await res.json();
  // Ollama may not be available, but the route should respond
  console.log(`✓ Chat endpoint responded (${res.status})`);

  // Delete template
  res = await fetch(`${AI_BASE}/templates/${templateId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error('Delete template failed');
  console.log('✓ Template deleted');

  // Delete provider
  res = await fetch(`${AI_BASE}/providers/${providerId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error('Delete provider failed');
  console.log('✓ Provider deleted');
}

// ─── IoT Tests ─────────────────────────────────────────────────────
async function testIot() {
  console.log('\n── IoT Architecture ──');

  // Create device
  let res = await fetch(`${IOT_BASE}/devices`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: 'sensor-temp-01',
      name: 'Temperature Sensor 01',
      type: 'sensor',
      location: 'Factory A - Line 1',
      metadata: JSON.stringify({ range: '-20..100', accuracy: '0.1' }),
    }),
  });
  let data = await res.json();
  if (res.status !== 200) throw new Error('Create device failed: ' + JSON.stringify(data));
  const deviceUuid = data.data?.id;
  console.log('✓ Device created');

  // List devices
  res = await fetch(`${IOT_BASE}/devices`, { headers: { 'Authorization': `Bearer ${token}` } });
  data = await res.json();
  if (res.status !== 200 || !data.data?.devices?.length) throw new Error('List devices failed');
  console.log('✓ Devices listed');

  // Get device by ID
  res = await fetch(`${IOT_BASE}/devices/${deviceUuid}`, { headers: { 'Authorization': `Bearer ${token}` } });
  data = await res.json();
  if (res.status !== 200) throw new Error('Get device failed');
  console.log('✓ Device fetched by UUID');

  // Ingest telemetry
  res = await fetch(`${IOT_BASE}/telemetry`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: 'sensor-temp-01',
      readings: [
        { key: 'temperature', value: '25.3', unit: 'celsius' },
        { key: 'humidity', value: '68', unit: '%' },
        { key: 'pressure', value: '1013', unit: 'hPa' },
      ],
    }),
  });
  data = await res.json();
  if (res.status !== 201) throw new Error('Ingest telemetry failed: ' + JSON.stringify(data));
  console.log('✓ Telemetry ingested');

  // Query telemetry
  res = await fetch(`${IOT_BASE}/telemetry?deviceId=sensor-temp-01`, { headers: { 'Authorization': `Bearer ${token}` } });
  data = await res.json();
  if (res.status !== 200 || !data.data?.telemetry?.length) throw new Error('Query telemetry failed');
  console.log('✓ Telemetry queried');

  // Latest telemetry
  res = await fetch(`${IOT_BASE}/telemetry/sensor-temp-01/latest`, { headers: { 'Authorization': `Bearer ${token}` } });
  data = await res.json();
  if (res.status !== 200) throw new Error('Latest telemetry failed');
  console.log('✓ Latest telemetry fetched');

  // MQTT publish
  res = await fetch(`${IOT_BASE}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: 'sensor-temp-01',
      topic: 'actuate/valve',
      payload: { command: 'open', duration: 5 },
    }),
  });
  data = await res.json();
  if (res.status !== 200) throw new Error('MQTT publish failed: ' + JSON.stringify(data));
  console.log('✓ MQTT publish');

  // Delete device
  res = await fetch(`${IOT_BASE}/devices/${deviceUuid}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error('Delete device failed');
  console.log('✓ Device deleted');
}

async function run() {
  console.log('Phase 27 E2E Tests\n');
  try {
    await login();
    await testAiGateway();
    await testIot();
    console.log('\n✓ All Phase 27 E2E tests passed!');
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
  }
}

run();
