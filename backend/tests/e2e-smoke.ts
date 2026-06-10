import { randomUUID } from 'crypto';

const API_BASE = process.env.API_URL || 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=============================================');
  console.log('   Starting E2E API Smoke Tests (Phase 13)');
  console.log(`   Target Endpoint: ${API_BASE}`);
  console.log('=============================================\n');

  let adminToken = '';
  let plannerToken = '';
  let operatorToken = '';
  const correlationId = randomUUID();

  // Helper function to call fetch and assert response
  async function api(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: any,
    token?: string
  ) {
    const url = `${API_BASE}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Not JSON
    }

    if (!res.ok) {
      throw new Error(`API call failed: ${method} ${path} -> Status ${res.status}. Error: ${text}`);
    }

    return { status: res.status, data: json?.data, headers: res.headers };
  }

  // 1. Health Check Test
  console.log('Test 1: Querying system health endpoint...');
  const healthRes = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
  if (!healthRes.ok) {
    throw new Error(`Health check failed with status ${healthRes.status}`);
  }
  const healthData = await healthRes.json();
  console.log('✔ Health check OK:', JSON.stringify(healthData));

  // 2. Auth Logins
  console.log('\nTest 2: Authenticating users...');
  
  // Admin login
  const adminLogin = await api('POST', '/auth/login', { username: 'admin', password: 'Password123!' });
  adminToken = adminLogin.data.token;
  console.log('✔ Admin authenticated successfully.');

  // Planner login
  const plannerLogin = await api('POST', '/auth/login', { username: 'planner1', password: 'Password123!' });
  plannerToken = plannerLogin.data.token;
  console.log('✔ Planner authenticated successfully.');

  // Operator login
  const operatorLogin = await api('POST', '/auth/login', { username: 'operator1', password: 'Password123!' });
  operatorToken = operatorLogin.data.token;
  console.log('✔ Operator authenticated successfully.');

  // 3. Customer & Product Creation
  console.log('\nTest 3: Creating Customer & Product...');
  const customerCode = `CUST-SMOKE-${Date.now().toString().slice(-4)}`;
  const productCode = `PROD-SMOKE-${Date.now().toString().slice(-4)}`;

  await api('POST', '/customers', {
    code: customerCode,
    name: 'Smoke Test Customer Corp',
    contactInfo: 'smoke@test.com'
  }, adminToken);
  console.log(`✔ Created Customer: ${customerCode}`);

  await api('POST', '/products', {
    code: productCode,
    name: 'Smoke Test Package',
    customerCode
  }, adminToken);
  console.log(`✔ Created Product: ${productCode} bound to Customer: ${customerCode}`);

  // 4. Cylinder Registration
  console.log('\nTest 4: Registering Cylinders...');
  const cylinderId = `CYL-SMOKE-${Date.now().toString().slice(-4)}`;
  await api('POST', '/cylinders', {
    id: cylinderId,
    productCode,
    color: 'BK',
    colorName: 'Black',
    location: 'Rack S-1',
    size: '800×250'
  }, adminToken);
  console.log(`✔ Registered Cylinder: ${cylinderId}`);

  // 5. Ink Formula & Batch Creation
  console.log('\nTest 5: Registering Ink Formula & Batch...');
  const formulaCode = `FORM-SMOKE-${Date.now().toString().slice(-4)}`;
  await api('POST', '/inks/formulas', {
    code: formulaCode,
    productCode,
    color: 'Black',
    pantone: 'Black C',
    viscosity: '18s',
    labTarget: 'L:20 a:0 b:0',
    solvent: 'Ethyl Acetate'
  }, adminToken);
  console.log(`✔ Created Ink Formula: ${formulaCode}`);

  // Near-expiry batch (mix date mix, expiry mix date + 5 days)
  const batchId = `MIX-SMOKE-${Date.now().toString().slice(-4)}`;
  const mixDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(mixDate.getDate() + 5); // Near expiry (FEFO warning)

  await api('POST', '/inks/batches', {
    id: batchId,
    formulaCode,
    productCode,
    color: 'Black',
    mixDate: mixDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    weight: 20.0,
    operator: 'Operator Smoke'
  }, adminToken);
  console.log(`✔ Created Ink Batch: ${batchId}`);

  // Update status to nearExpiry
  await api('PUT', `/inks/batches/${batchId}`, {
    remaining: 20.0,
    status: 'nearExpiry'
  }, adminToken);
  console.log(`✔ Updated Ink Batch status to nearExpiry.`);

  // 6. Sales Order Creation
  console.log('\nTest 6: Creating Sales Order...');
  const orderNumber = `SO-SMOKE-${Date.now().toString().slice(-4)}`;
  const order = await api('POST', '/orders', {
    orderNumber,
    customerCode,
    productCode,
    quantity: 10000.0,
    unit: 'm',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString() // 7 days from now
  }, adminToken);
  console.log(`✔ Created Sales Order: ${orderNumber}`);

  // 7. Production Job Creation
  console.log('\nTest 7: Creating Production Job...');
  const jobNumber = `JOB-SMOKE-${Date.now().toString().slice(-4)}`;
  await api('POST', '/jobs', {
    jobNumber,
    orderNumber,
    productCode,
    machineName: 'M-Test',
    plannedDate: new Date().toISOString()
  }, plannerToken);
  console.log(`✔ Created Production Job: ${jobNumber}`);

  // 8. Scanner Verification (Should trigger near-expiry override warning)
  console.log('\nTest 8: Performing Scanner Verification...');
  const verifyRes = await api('POST', `/jobs/${jobNumber}/verify`, {
    verifiedBy: 'planner1',
    scannedCylinderIds: [cylinderId],
    scannedInkBatchIds: [batchId]
  }, plannerToken);
  
  const verification = verifyRes.data;
  console.log(`✔ Verification checked. Passed: ${verification.isPassed}, Requires Override: ${verification.requiresOverride}`);
  if (verification.isPassed) {
    throw new Error('Expected verification to require supervisor override due to near-expiry ink batch.');
  }

  // 9. Supervisor Override Flow
  console.log('\nTest 9: Applying Supervisor Override...');
  const overrideRes = await api('POST', `/jobs/${jobNumber}/override`, {
    overrideBy: 'admin'
  }, adminToken);
  console.log(`✔ Supervisor override applied successfully. New verification state:`, overrideRes.data.isPassed);
  if (!overrideRes.data.isPassed) {
    throw new Error('Expected verification state to be passed after override.');
  }

  // Update job status to active
  await api('PUT', `/jobs/${jobNumber}/status`, { status: 'active' }, plannerToken);
  console.log('✔ Job status updated to ACTIVE.');

  // 10. Production Run Logging (decrements ink, increments cylinder mileage)
  console.log('\nTest 10: Logging Production Run (5,000 meters)...');
  await api('POST', `/jobs/${jobNumber}/logs`, {
    machineName: 'M-Test',
    operator: 'Operator Smoke',
    startMeter: 0,
    endMeter: 5000,
    scrapQuantity: 50
  }, operatorToken);
  console.log('✔ Logged production run successfully.');

  // Verify cylinder and ink batch updates
  const updatedCylinder = await api('GET', `/cylinders/${cylinderId}`, undefined, adminToken);
  console.log(`✔ Verified Cylinder Mileage: Expected >0, Actual: ${updatedCylinder.data.meter}`);
  if (updatedCylinder.data.meter !== 5000) {
    throw new Error(`Expected cylinder mileage to be 5000, got ${updatedCylinder.data.meter}`);
  }

  const updatedInk = await api('GET', `/inks/batches/${batchId}`, undefined, adminToken);
  console.log(`✔ Verified Ink Weight: Expected <20.0, Actual: ${updatedInk.data.remaining}`);
  if (updatedInk.data.remaining >= 20.0) {
    throw new Error(`Expected ink batch weight to decrement, got ${updatedInk.data.remaining}`);
  }

  // 11. QC Inspections Checklist
  console.log('\nTest 11: Submitting QC Inspection Checklist...');
  await api('POST', `/qc/inspections/${jobNumber}`, {
    inspector: 'qc1',
    shadeResult: 'match',
    barcodePassed: true,
    colorSequencePassed: true,
    adhesionPassed: true,
    remarks: 'Smoke test inspection passed successfully.'
  }, adminToken);
  console.log('✔ Logged QC sheet record.');

  // 12. Traceability Compilation
  console.log('\nTest 12: Querying Multi-Dimensional Traceability History...');
  const traceRes = await api('GET', `/qc/traceability?dimension=job&query=${jobNumber}`, undefined, adminToken);
  const trace = traceRes.data;
  console.log(`✔ Compiled history for Job ${jobNumber}:`);
  console.log(`   - Product SKU: ${trace.productCode}`);
  console.log(`   - Cylinders used: ${trace.cylinders.map((c: any) => c.cylinderId).join(', ')}`);
  console.log(`   - Ink Batches consumed: ${trace.inks.map((i: any) => i.batchId).join(', ')}`);

  if (trace.cylinders.length === 0 || trace.inks.length === 0) {
    throw new Error('Traceability data was not aggregated properly.');
  }

  // 13. Audit Trail Verification
  console.log('\nTest 13: Querying System Audit logs...');
  const auditRes = await api('GET', '/audit/logs?limit=10', undefined, adminToken);
  console.log('✔ System audit logs retrieved. Current size:', auditRes.data.length);
  const myAuditLogs = auditRes.data.filter((l: any) => l.correlationId === correlationId);
  console.log(`✔ Actions traced under correlation ID [${correlationId}]:`);
  myAuditLogs.forEach((l: any) => {
    console.log(`   [${l.createdAt.split('T')[1].slice(0, 8)}] - ${l.action}: ${l.details}`);
  });

  if (myAuditLogs.length < 5) {
    throw new Error(`Expected at least 5 audit logs for this correlation session, got ${myAuditLogs.length}`);
  }

  // 14. Background Queue Job Verification
  console.log('\nTest 14: Triggering background queue job...');
  const queueRes = await api('POST', '/queue/test-job', {
    jobType: 'GENERATE_REPORT',
    payload: {
      reportType: 'Production-Summary-Q2'
    }
  }, adminToken);

  console.log(`✔ Background job enqueued successfully. Job ID: ${queueRes.data.jobId}`);
  if (!queueRes.data.jobId) {
    throw new Error('Expected a jobId returned from queue route');
  }

  console.log('   Waiting 4 seconds for worker to process job...');
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Verify that the worker has successfully logged the audit entry
  const postAuditRes = await api('GET', '/audit/logs?limit=50', undefined, adminToken);
  const queueAuditLogs = postAuditRes.data.filter(
    (l: any) => l.correlationId === correlationId && l.action === 'REPORT_GENERATION_COMPLETED'
  );

  if (queueAuditLogs.length === 0) {
    throw new Error('Background job did not create completion audit log under correlation ID');
  }

  console.log('✔ Background worker processed job and recorded audit log:');
  console.log(`   - Details: ${queueAuditLogs[0].details}`);

  console.log('\n=============================================');
  console.log('   E2E API SMOKE TESTS COMPLETED SUCCESSFULLY!  ');
  console.log('   All integrated flows verified.               ');
  console.log('=============================================\n');
}

runTests().catch((error) => {
  console.error('\n❌ E2E Smoke Tests failed!');
  console.error(error);
  process.exit(1);
});
