const BASE = 'http://localhost:5000/api/v1';
async function main() {
  let res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Password123!' }),
  });
  const data = await res.json();
  const token = data.data?.accessToken || data.accessToken;
  console.log('Token:', token?.substring(0, 20));

  // Try create provider
  res = await fetch(`${BASE}/ai/providers`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Local Ollama', providerType: 'ollama', modelName: 'llama3', baseUrl: 'http://ollama:11434', isActive: true }),
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text.substring(0, 500));
}
main().catch(console.error);
