// k6 load test — iSmart Gravure Management
// Usage: k6 run scripts/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api/v1';
const USERNAME = __ENV.USERNAME || 'admin';
const PASSWORD = __ENV.PASSWORD || 'Password123$';

const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration');
const queryTrend = new Trend('query_duration');

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // ramp up
    { duration: '2m', target: 50 },  // steady
    { duration: '1m', target: 100 }, // peak
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    errors: ['rate<0.05'],         // <5% errors
    http_req_duration: ['p(95)<2000'], // 95% under 2s
  },
};

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: USERNAME, password: PASSWORD,
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, { 'login ok': (r) => r.status === 200 });
  errorRate.add(loginRes.status !== 200);
  loginTrend.add(loginRes.timings.duration);

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const token = loginRes.json().data?.accessToken || loginRes.json().accessToken;
  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Health check
  const healthRes = http.get(`${BASE_URL.replace('/api/v1', '')}/health`);
  check(healthRes, { 'health ok': (r) => r.status === 200 });

  // List entities (mixed)
  const endpoints = [
    { url: `${BASE_URL}/cylinders`, method: 'GET' },
    { url: `${BASE_URL}/inks`, method: 'GET' },
    { url: `${BASE_URL}/jobs`, method: 'GET' },
    { url: `${BASE_URL}/orders`, method: 'GET' },
    { url: `${BASE_URL}/notifications/prefs/me`, method: 'GET' },
    { url: `${BASE_URL}/iot/devices`, method: 'GET' },
    { url: `${BASE_URL}/ai/providers`, method: 'GET' },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(ep.url, { headers: authHeaders });

  check(res, { [`${ep.url} ok`]: (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  queryTrend.add(res.timings.duration);

  sleep(Math.random() * 2 + 0.5);
}
