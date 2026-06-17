import { CylinderStatus, InkFormulaStatus, InkBatchStatus, JobStatus, QcStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database';
import { seed as seedPermissions } from './seed-permissions';

async function main() {
  // Seed permissions first (they are a prerequisite for role-based operations)
  await seedPermissions();

  console.log('Seeding database with test accounts...');

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const testAccounts = [
    { username: 'admin', role: 'admin' },
    { username: 'sales1', role: 'sales' },
    { username: 'planner1', role: 'planner' },
    { username: 'operator1', role: 'production' },
    { username: 'qc1', role: 'qc' },
    { username: 'warehouse1', role: 'warehouse' },
    { username: 'inkroom1', role: 'inkroom' },
    { username: 'viewer1', role: 'viewer' },
  ];

  for (const account of testAccounts) {
    const user = await prisma.user.upsert({
      where: { username: account.username },
      update: {
        role: account.role,
        passwordHash
      },
      create: {
        username: account.username,
        role: account.role,
        passwordHash
      }
    });
    console.log(`Created/Updated user: ${user.username} with role ${user.role}`);
  }

  // --- Seed Customers ---
  console.log('Seeding Customers...');
  const customers = [
    { code: 'CUST-EXCEL', name: 'บริษัท เอ็กซ์เซล ฟู้ดส์', contactInfo: 'info@excelfoods.com' },
    { code: 'CUST-SIAMPACK', name: 'บริษัท สยามแพ็ค', contactInfo: 'contact@siampack.com' },
    { code: 'CUST-TPI', name: 'บริษัท ทีพีไอ โพลีน', contactInfo: 'sales@tpipolene.co.th' },
  ];
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { code: c.code },
      update: { name: c.name, contactInfo: c.contactInfo },
      create: c
    });
  }

  // --- Seed Products ---
  console.log('Seeding Products...');
  const products = [
    { code: 'AGH-001', name: 'AGH-001 Package', customerCode: 'CUST-EXCEL' },
    { code: 'AGH-002', name: 'AGH-002 Package', customerCode: 'CUST-EXCEL' },
    { code: 'BKK-002', name: 'BKK-002 Package', customerCode: 'CUST-SIAMPACK' },
    { code: 'BKK-003', name: 'BKK-003 Pack', customerCode: 'CUST-TPI' },
    { code: 'CNX-001', name: 'CNX-001 Pack', customerCode: 'CUST-TPI' },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: { name: p.name, customerCode: p.customerCode },
      create: p
    });
  }

  // --- Seed Cylinders ---
  console.log('Seeding Cylinders...');
  const cylinders = [
    { id: 'CYL-BK-001', productCode: 'AGH-001', color: 'BK', colorName: 'Black', status: CylinderStatus.available, location: 'Rack A-03', meter: 125000, type: 'Dedicated', size: '800×250' },
    { id: 'CYL-CY-001', productCode: 'AGH-001', color: 'CY', colorName: 'Cyan', status: CylinderStatus.inProduction, location: 'Machine M-03', meter: 98500, type: 'Dedicated', size: '800×250' },
    { id: 'CYL-MG-001', productCode: 'AGH-001', color: 'MG', colorName: 'Magenta', status: CylinderStatus.inProduction, location: 'Machine M-03', meter: 101200, type: 'Dedicated', size: '800×250' },
    { id: 'CYL-YL-001', productCode: 'AGH-001', color: 'YL', colorName: 'Yellow', status: CylinderStatus.reserved, location: 'Rack A-04', meter: 88000, type: 'Dedicated', size: '800×250' },
    { id: 'CYL-WH-001', productCode: 'AGH-001', color: 'WH', colorName: 'White', status: CylinderStatus.available, location: 'Rack B-01', meter: 150000, type: 'Shared', size: '800×250' },
    { id: 'CYL-BK-005', productCode: 'BKK-002', color: 'BK', colorName: 'Black', status: CylinderStatus.repair, location: 'Repair Shop', meter: 210000, type: 'Shared', size: '900×300' },
    { id: 'CYL-VN-003', productCode: 'AGH-001', color: 'VN', colorName: 'Varnish', status: CylinderStatus.inspection, location: 'QC Area', meter: 75000, type: 'Common', size: '800×250' },
    { id: 'CYL-FL-010', productCode: 'BKK-003', color: 'FL', colorName: 'Flavor', status: CylinderStatus.available, location: 'Rack C-02', meter: 45000, type: 'Dedicated', size: '750×220' },
  ];
  for (const cyl of cylinders) {
    await prisma.cylinder.upsert({
      where: { id: cyl.id },
      update: {
        productCode: cyl.productCode,
        color: cyl.color,
        colorName: cyl.colorName,
        status: cyl.status,
        location: cyl.location,
        meter: cyl.meter,
        type: cyl.type,
        size: cyl.size
      },
      create: cyl
    });
  }

  // --- Seed Ink Formulas ---
  console.log('Seeding Ink Formulas...');
  const formulas = [
    { code: 'INK-BK-R03', productCode: 'AGH-001', color: 'Black', pantone: 'Process Black', revision: 'Rev.03', status: InkFormulaStatus.active, viscosity: '18±2 sec', labTarget: 'L:25 a:0 b:1', solvent: 'Ethyl Acetate' },
    { code: 'INK-CY-R02', productCode: 'AGH-001', color: 'Cyan', pantone: 'PMS 299C', revision: 'Rev.02', status: InkFormulaStatus.active, viscosity: '16±2 sec', labTarget: 'L:55 a:-30 b:-45', solvent: 'Ethyl Acetate' },
    { code: 'INK-MG-R01', productCode: 'AGH-001', color: 'Magenta', pantone: 'PMS 226C', revision: 'Rev.01', status: InkFormulaStatus.active, viscosity: '17±2 sec', labTarget: 'L:48 a:70 b:-5', solvent: 'Toluene' },
    { code: 'INK-WH-R04', productCode: 'AGH-001', color: 'White', pantone: 'Opaque White', revision: 'Rev.04', status: InkFormulaStatus.active, viscosity: '20±2 sec', labTarget: 'L:95 a:0 b:2', solvent: 'Ethyl Acetate' },
    { code: 'INK-BK-R02', productCode: 'AGH-001', color: 'Black', pantone: 'Process Black', revision: 'Rev.02', status: InkFormulaStatus.superseded, viscosity: '18±2 sec', labTarget: 'L:24 a:0 b:0', solvent: 'Toluene' },
  ];
  for (const f of formulas) {
    await prisma.inkFormula.upsert({
      where: { code: f.code },
      update: {
        productCode: f.productCode,
        color: f.color,
        pantone: f.pantone,
        revision: f.revision,
        status: f.status,
        viscosity: f.viscosity,
        labTarget: f.labTarget,
        solvent: f.solvent
      },
      create: f
    });
  }

  // --- Seed Ink Batches ---
  console.log('Seeding Ink Batches...');
  const batches = [
    { id: 'MIX-2024-089', formulaCode: 'INK-BK-R03', productCode: 'AGH-001', color: 'Black', mixDate: new Date('2024-06-18'), expiryDate: new Date('2024-09-18'), weight: 18.5, remaining: 12.3, operator: 'สมหมาย', status: InkBatchStatus.active },
    { id: 'MIX-2024-090', formulaCode: 'INK-CY-R02', productCode: 'AGH-001', color: 'Cyan', mixDate: new Date('2024-06-19'), expiryDate: new Date('2024-07-05'), weight: 15.0, remaining: 8.2, operator: 'วิไล', status: InkBatchStatus.nearExpiry },
    { id: 'MIX-2024-085', formulaCode: 'INK-MG-R01', productCode: 'AGH-001', color: 'Magenta', mixDate: new Date('2024-06-15'), expiryDate: new Date('2024-06-22'), weight: 12.0, remaining: 3.1, operator: 'สมหมาย', status: InkBatchStatus.nearExpiry },
    { id: 'RAW-2024-001', formulaCode: null, productCode: null, color: 'Black Base', mixDate: null, expiryDate: new Date('2024-12-31'), weight: 50.0, remaining: 38.5, operator: 'DIC Corp', status: InkBatchStatus.active },
    { id: 'RAW-2023-099', formulaCode: null, productCode: null, color: 'Magenta Base', mixDate: null, expiryDate: new Date('2024-06-30'), weight: 25.0, remaining: 2.1, operator: 'Toyo Ink', status: InkBatchStatus.expired },
  ];
  for (const b of batches) {
    await prisma.inkBatch.upsert({
      where: { id: b.id },
      update: {
        formulaCode: b.formulaCode,
        productCode: b.productCode,
        color: b.color,
        mixDate: b.mixDate,
        expiryDate: b.expiryDate,
        weight: b.weight,
        remaining: b.remaining,
        operator: b.operator,
        status: b.status
      },
      create: b
    });
  }

  // --- Seed Sales Orders ---
  console.log('Seeding Sales Orders...');
  const salesOrders = [
    { orderNumber: 'SO2024-001', customerCode: 'CUST-EXCEL', productCode: 'AGH-001', quantity: 25000, unit: 'm', dueDate: new Date('2024-06-25'), status: 'active' },
    { orderNumber: 'SO2024-002', customerCode: 'CUST-SIAMPACK', productCode: 'BKK-002', quantity: 30000, unit: 'm', dueDate: new Date('2024-06-24'), status: 'completed' },
    { orderNumber: 'SO2024-003', customerCode: 'CUST-TPI', productCode: 'BKK-003', quantity: 20000, unit: 'm', dueDate: new Date('2024-06-23'), status: 'completed' },
    { orderNumber: 'SO2024-004', customerCode: 'CUST-EXCEL', productCode: 'AGH-002', quantity: 15000, unit: 'm', dueDate: new Date('2024-06-22'), status: 'completed' },
    { orderNumber: 'SO2024-005', customerCode: 'CUST-TPI', productCode: 'CNX-001', quantity: 50000, unit: 'm', dueDate: new Date('2024-06-30'), status: 'pending' },
  ];
  for (const so of salesOrders) {
    await prisma.salesOrder.upsert({
      where: { orderNumber: so.orderNumber },
      update: {
        customerCode: so.customerCode,
        productCode: so.productCode,
        quantity: so.quantity,
        unit: so.unit,
        dueDate: so.dueDate,
        status: so.status
      },
      create: so
    });
  }

  // --- Seed Production Jobs ---
  console.log('Seeding Production Jobs...');
  const jobs = [
    { jobNumber: 'J2024-045', orderNumber: 'SO2024-001', productCode: 'AGH-001', machineName: 'M-03', plannedDate: new Date('2024-06-20'), status: JobStatus.active, totalPrinted: 15200 },
    { jobNumber: 'J2024-044', orderNumber: 'SO2024-002', productCode: 'BKK-002', machineName: 'M-01', plannedDate: new Date('2024-06-19'), status: JobStatus.completed, totalPrinted: 22000 },
    { jobNumber: 'J2024-043', orderNumber: 'SO2024-003', productCode: 'BKK-003', machineName: 'M-02', plannedDate: new Date('2024-06-18'), status: JobStatus.completed, totalPrinted: 18500 },
    { jobNumber: 'J2024-042', orderNumber: 'SO2024-004', productCode: 'AGH-002', machineName: 'M-03', plannedDate: new Date('2024-06-17'), status: JobStatus.completed, totalPrinted: 30100 },
    { jobNumber: 'J2024-046', orderNumber: 'SO2024-005', productCode: 'CNX-001', machineName: 'M-04', plannedDate: new Date('2024-06-21'), status: JobStatus.pending, totalPrinted: 0 },
  ];
  for (const job of jobs) {
    await prisma.productionJob.upsert({
      where: { jobNumber: job.jobNumber },
      update: {
        orderNumber: job.orderNumber,
        productCode: job.productCode,
        machineName: job.machineName,
        plannedDate: job.plannedDate,
        status: job.status,
        totalPrinted: job.totalPrinted
      },
      create: job
    });
  }

  // --- Seed Job Verifications ---
  console.log('Seeding Job Verifications...');
  const verifications = [
    { jobNumber: 'J2024-045', verifiedBy: 'planner1', isPassed: true, scannedCylinders: 'CYL-BK-001,CYL-CY-001,CYL-MG-001,CYL-YL-001', scannedInkBatches: 'MIX-2024-089,MIX-2024-090', requiresOverride: true, overrideBy: 'admin' },
    { jobNumber: 'J2024-044', verifiedBy: 'planner1', isPassed: true, scannedCylinders: 'CYL-BK-005,CYL-MG-001', scannedInkBatches: 'MIX-2024-089', requiresOverride: false, overrideBy: null },
    { jobNumber: 'J2024-043', verifiedBy: 'planner1', isPassed: true, scannedCylinders: 'CYL-FL-010', scannedInkBatches: 'MIX-2024-085', requiresOverride: true, overrideBy: 'admin' },
  ];
  for (const v of verifications) {
    await prisma.jobVerification.upsert({
      where: { jobNumber: v.jobNumber },
      update: {
        verifiedBy: v.verifiedBy,
        isPassed: v.isPassed,
        scannedCylinders: v.scannedCylinders,
        scannedInkBatches: v.scannedInkBatches,
        requiresOverride: v.requiresOverride,
        overrideBy: v.overrideBy
      },
      create: v
    });
  }

  // --- Seed Production Logs ---
  console.log('Seeding Production Logs...');
  const logs = [
    { jobNumber: 'J2024-045', machineName: 'M-03', operator: 'สมชาย', startMeter: 0, endMeter: 15200, totalPrinted: 15200, scrapQuantity: 120, status: 'completed' },
    { jobNumber: 'J2024-044', machineName: 'M-01', operator: 'วิชัย', startMeter: 0, endMeter: 22000, totalPrinted: 22000, scrapQuantity: 180, status: 'completed' },
    { jobNumber: 'J2024-043', machineName: 'M-02', operator: 'สมชาย', startMeter: 0, endMeter: 18500, totalPrinted: 18500, scrapQuantity: 95, status: 'completed' },
    { jobNumber: 'J2024-042', machineName: 'M-03', operator: 'ประยุทธ์', startMeter: 0, endMeter: 30100, totalPrinted: 30100, scrapQuantity: 250, status: 'completed' },
  ];
  for (const log of logs) {
    // We don't have a unique key on production logs in schema, so let's delete existing logs for this job first to prevent duplicates when re-seeding
    await prisma.productionLog.deleteMany({
      where: { jobNumber: log.jobNumber }
    });
    await prisma.productionLog.create({
      data: log
    });
  }

  // --- Seed QC Inspections ---
  console.log('Seeding QC Inspections...');
  const qcInspections = [
    { jobNumber: 'J2024-044', inspector: 'qc1', shadeResult: 'match', barcodePassed: true, colorSequencePassed: true, adhesionPassed: true, status: QcStatus.pass, remarks: 'เรียบร้อยดี' },
    { jobNumber: 'J2024-043', inspector: 'qc1', shadeResult: 'match', barcodePassed: true, colorSequencePassed: true, adhesionPassed: true, status: QcStatus.pass, remarks: 'ผ่านเกณฑ์' },
  ];
  for (const qc of qcInspections) {
    await prisma.qcInspection.deleteMany({
      where: { jobNumber: qc.jobNumber }
    });
    await prisma.qcInspection.create({
      data: qc
    });
  }

  // --- Seed Audit Logs ---
  console.log('Seeding Audit Logs...');
  await prisma.auditLog.deleteMany({});
  const mockAuditLogs = [
    { action: 'auth.login', userId: null, username: 'admin', details: 'User admin logged in successfully', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: '98e27c73-f112-40a2-b9cf-2b819f727bb0' },
    { action: 'sales_order.create', userId: null, username: 'sales1', details: 'Created Sales Order SO2024-001 for product AGH-001', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: '54261899-7f55-4076-928d-beadcd36a6cf' },
    { action: 'production_job.create', userId: null, username: 'planner1', details: 'Created Production Job J2024-045 for product AGH-001', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: '3c8e9b62-9844-4866-b333-68d7120a1122' },
    { action: 'production_job.verify', userId: null, username: 'planner1', details: 'Verified items for Job J2024-045. Passed: false, Requires Override: true', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: 'e2815124-78aa-4623-8cfb-6f68e99aa201' },
    { action: 'production_job.override', userId: null, username: 'admin', details: 'Supervisor override applied for Job J2024-045 by admin', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: 'ea8b21c4-1188-4cf2-83b8-39281e8aa299' },
    { action: 'production_job.log_run', userId: null, username: 'operator1', details: 'Logged run for Job J2024-045. Start: 0, End: 15200, Total: 15200, Scrap: 120', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: 'fb0981e4-44aa-492a-a92c-68f7aa99bb10' },
    { action: 'qc_inspection.create', userId: null, username: 'qc1', details: 'Recorded QC inspection for Job J2024-044. Result: pass', ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0', correlationId: '49e89b21-4f11-408a-b9cf-2b819f727cba' },
  ];
  for (const log of mockAuditLogs) {
    await prisma.auditLog.create({
      data: log
    });
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
