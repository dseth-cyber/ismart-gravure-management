import { prisma } from '../src/config/database';

const WORKFLOWS = [
  {
    name: 'leave_request',
    description: 'Employee leave request approval chain',
    config: {
      steps: [
        { index: 0, label: 'Manager Approval', approverRole: 'admin', escalationMinutes: 1440 },
        { index: 1, label: 'HR Confirmation', approverRole: 'admin', escalationMinutes: 1440 },
      ],
    },
  },
  {
    name: 'purchase_order',
    description: 'Purchase order approval (amount-based routing)',
    config: {
      steps: [
        { index: 0, label: 'Department Manager Approval', approverRole: 'admin', escalationMinutes: 720 },
        { index: 1, label: 'Purchasing Review', approverRole: 'admin', escalationMinutes: 720 },
        { index: 2, label: 'Director Approval (if amount > 100,000)', approverRole: 'admin', escalationMinutes: 1440 },
      ],
    },
  },
  {
    name: 'inventory_adjust',
    description: 'Inventory adjustment approval',
    config: {
      steps: [
        { index: 0, label: 'Warehouse Supervisor Approval', approverRole: 'admin', escalationMinutes: 480 },
        { index: 1, label: 'Manager Approval', approverRole: 'admin', escalationMinutes: 720 },
      ],
    },
  },
  {
    name: 'sales_discount',
    description: 'Sales discount override approval',
    config: {
      steps: [
        { index: 0, label: 'Sales Manager Approval', approverRole: 'admin', escalationMinutes: 480 },
        { index: 1, label: 'Director Approval', approverRole: 'admin', escalationMinutes: 1440 },
      ],
    },
  },
  {
    name: 'qc_override',
    description: 'QC failure override approval',
    config: {
      steps: [
        { index: 0, label: 'QC Manager Review', approverRole: 'admin', escalationMinutes: 240 },
        { index: 1, label: 'Production Director Approval', approverRole: 'admin', escalationMinutes: 480 },
      ],
    },
  },
];

async function seed() {
  console.log('\n=== Seeding Workflow Definitions ===\n');

  for (const wf of WORKFLOWS) {
    const existing = await prisma.workflowDefinition.findUnique({ where: { name: wf.name } });
    if (existing) {
      console.log(`  Skipped: ${wf.name} (already exists)`);
      continue;
    }

    await prisma.workflowDefinition.create({
      data: {
        name: wf.name,
        description: wf.description,
        config: JSON.stringify(wf.config),
      },
    });
    console.log(`  Created: ${wf.name}`);
  }

  console.log('\n=== Workflow seeding complete ===\n');
}

seed()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
