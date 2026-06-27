import { prisma } from '../src/config/database';

// ── Define all permissions ──
const PERMISSION_DEFS = [
  // Auth module
  { name: 'auth:users.read', module: 'auth', action: 'users.read', description: 'View user list and profiles' },
  { name: 'auth:users.create', module: 'auth', action: 'users.create', description: 'Create new users' },
  { name: 'auth:users.update', module: 'auth', action: 'users.update', description: 'Edit user details and roles' },
  { name: 'auth:users.delete', module: 'auth', action: 'users.delete', description: 'Delete users' },
  { name: 'auth:roles.manage', module: 'auth', action: 'roles.manage', description: 'Manage role-permission assignments' },

  // Customer module
  { name: 'customers:read', module: 'customers', action: 'customers.read', description: 'View customer list' },
  { name: 'customers:create', module: 'customers', action: 'customers.create', description: 'Create customers' },
  { name: 'customers:update', module: 'customers', action: 'customers.update', description: 'Edit customer details' },
  { name: 'customers:delete', module: 'customers', action: 'customers.delete', description: 'Delete customers' },

  // Product module
  { name: 'products:read', module: 'products', action: 'products.read', description: 'View product list' },
  { name: 'products:create', module: 'products', action: 'products.create', description: 'Create products' },
  { name: 'products:update', module: 'products', action: 'products.update', description: 'Edit product details' },
  { name: 'products:delete', module: 'products', action: 'products.delete', description: 'Delete products' },

  // Cylinder module
  { name: 'cylinders:read', module: 'cylinders', action: 'cylinders.read', description: 'View cylinder inventory' },
  { name: 'cylinders:create', module: 'cylinders', action: 'cylinders.create', description: 'Add cylinders' },
  { name: 'cylinders:update', module: 'cylinders', action: 'cylinders.update', description: 'Edit cylinder details' },
  { name: 'cylinders:delete', module: 'cylinders', action: 'cylinders.delete', description: 'Delete cylinders' },
  { name: 'cylinders:status.update', module: 'cylinders', action: 'cylinders.status.update', description: 'Change cylinder status' },
  { name: 'cylinders:maintenance.manage', module: 'cylinders', action: 'cylinders.maintenance.manage', description: 'Schedule cylinder maintenance' },

  // Ink module
  { name: 'inks:read', module: 'inks', action: 'inks.read', description: 'View ink inventory' },
  { name: 'inks:create', module: 'inks', action: 'inks.create', description: 'Create ink batches' },
  { name: 'inks:update', module: 'inks', action: 'inks.update', description: 'Edit ink batches' },
  { name: 'inks:delete', module: 'inks', action: 'inks.delete', description: 'Delete ink batches' },
  { name: 'inks:formulas.manage', module: 'inks', action: 'inks.formulas.manage', description: 'Manage ink formulas' },

  // Sales Order module
  { name: 'orders:read', module: 'orders', action: 'orders.read', description: 'View sales orders' },
  { name: 'orders:create', module: 'orders', action: 'orders.create', description: 'Create sales orders' },
  { name: 'orders:update', module: 'orders', action: 'orders.update', description: 'Edit sales orders' },
  { name: 'orders:delete', module: 'orders', action: 'orders.delete', description: 'Delete sales orders' },
  { name: 'orders:approve', module: 'orders', action: 'orders.approve', description: 'Approve sales orders' },

  // Production Job module
  { name: 'jobs:read', module: 'jobs', action: 'jobs.read', description: 'View production jobs' },
  { name: 'jobs:create', module: 'jobs', action: 'jobs.create', description: 'Create jobs from orders' },
  { name: 'jobs:update', module: 'jobs', action: 'jobs.update', description: 'Edit job details' },
  { name: 'jobs:delete', module: 'jobs', action: 'jobs.delete', description: 'Delete/cancel jobs' },
  { name: 'jobs:status.update', module: 'jobs', action: 'jobs.status.update', description: 'Change job status' },
  { name: 'jobs:verify', module: 'jobs', action: 'jobs.verify', description: 'Verify job materials' },
  { name: 'jobs:override', module: 'jobs', action: 'jobs.override', description: 'Override verification failures' },
  { name: 'jobs:log.run', module: 'jobs', action: 'jobs.log.run', description: 'Log production run' },

  // QC module
  { name: 'qc:read', module: 'qc', action: 'qc.read', description: 'View QC inspections' },
  { name: 'qc:create', module: 'qc', action: 'qc.create', description: 'Record inspections' },
  { name: 'qc:approve', module: 'qc', action: 'qc.approve', description: 'Approve/reject QC results' },
  { name: 'qc:override', module: 'qc', action: 'qc.override', description: 'Override QC failures' },

  // Audit module
  { name: 'audit:read', module: 'audit', action: 'audit.read', description: 'View audit logs' },
  { name: 'audit:export', module: 'audit', action: 'audit.export', description: 'Export audit logs' },

  // Permission management
  { name: 'permissions:manage', module: 'permissions', action: 'permissions.manage', description: 'Manage permissions and role assignments' },
  { name: 'permissions:scopes.manage', module: 'permissions', action: 'permissions.scopes.manage', description: 'Manage data scopes' },

  // Settings & System Configurations
  { name: 'settings:master.manage', module: 'settings', action: 'master.manage', description: 'Manage master data setup' },
  { name: 'workflows:rules.manage', module: 'workflows', action: 'rules.manage', description: 'Manage auto rules engine' },
  { name: 'workflows:approvals.manage', module: 'workflows', action: 'approvals.manage', description: 'Manage approval matrix configuration' },
  { name: 'notifications:settings.manage', module: 'notifications', action: 'settings.manage', description: 'Manage notification templates and channels' },
  { name: 'settings:system.manage', module: 'settings', action: 'system.manage', description: 'Manage system settings and menus visibility' },

  // Inventory module (future)
  { name: 'inventory:read', module: 'inventory', action: 'inventory.read', description: 'View inventory' },
  { name: 'inventory:adjust', module: 'inventory', action: 'inventory.adjust', description: 'Adjust inventory levels' },
  { name: 'inventory:approve', module: 'inventory', action: 'inventory.approve', description: 'Approve inventory adjustments' },

  // Approvals workflow
  { name: 'approvals:read', module: 'approvals', action: 'approvals.read', description: 'View pending approvals' },

  // Reporting
  { name: 'reports:view', module: 'reports', action: 'reports.view', description: 'View reports and dashboards' },
  { name: 'reports:export', module: 'reports', action: 'reports.export', description: 'Export reports' },
  { name: 'reports:duplicates.view', module: 'reports', action: 'reports.duplicates.view', description: 'View duplicate data report' },

  // Progress/Roadmap
  { name: 'progress:read', module: 'progress', action: 'progress.read', description: 'View project roadmap and progress' },
];

// ── Permission map per role ──
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'auth:*', 'customers:*', 'products:*', 'cylinders:*', 'inks:*',
    'orders:*', 'jobs:*', 'qc:*', 'audit:*', 'permissions:*',
    'inventory:*', 'reports:*', 'progress:*',
    'settings:*', 'workflows:*', 'notifications:*', 'approvals:*',
  ],
  sales: [
    'customers:read', 'customers:create', 'customers:update',
    'products:read',
    'orders:read', 'orders:create', 'orders:update',
    'jobs:read',
    'reports:view',
    'progress:read',
  ],
  planner: [
    'customers:read', 'products:read', 'products:create',
    'cylinders:read', 'cylinders:status.update',
    'inks:read', 'inks:formulas.manage',
    'orders:read',
    'jobs:read', 'jobs:create', 'jobs:update', 'jobs:status.update',
    'jobs:verify',
    'approvals:read',
    'qc:read',
    'reports:view', 'reports:duplicates.view',
    'progress:read',
  ],
  production: [
    'cylinders:read', 'cylinders:status.update',
    'inks:read',
    'jobs:read', 'jobs:log.run',
    'reports:view',
    'progress:read',
  ],
  qc: [
    'cylinders:read',
    'inks:read',
    'jobs:read',
    'approvals:read',
    'qc:read', 'qc:create', 'qc:approve',
    'reports:view', 'reports:duplicates.view',
    'progress:read',
  ],
  warehouse: [
    'cylinders:read', 'cylinders:create', 'cylinders:update',
    'inks:read', 'inks:create', 'inks:update',
    'inventory:read', 'inventory:adjust',
    'reports:view',
    'progress:read',
  ],
  inkroom: [
    'inks:read', 'inks:create', 'inks:update',
    'inks:formulas.manage',
    'cylinders:read',
    'inventory:read',
    'reports:view',
    'progress:read',
  ],
  viewer: [
    'customers:read', 'products:read', 'cylinders:read', 'inks:read',
    'orders:read', 'jobs:read', 'qc:read',
    'approvals:read',
    'reports:view', 'reports:duplicates.view',
    'progress:read',
  ],
};

const DEFAULT_ROLES = [
  { name: 'admin', description: 'Full system access', isSystem: true },
  { name: 'sales', description: 'Sales team member', isSystem: true },
  { name: 'planner', description: 'Production planner', isSystem: true },
  { name: 'production', description: 'Production operator', isSystem: true },
  { name: 'qc', description: 'Quality control inspector', isSystem: true },
  { name: 'warehouse', description: 'Warehouse staff', isSystem: true },
  { name: 'inkroom', description: 'Ink room operator', isSystem: true },
  { name: 'viewer', description: 'Read-only access', isSystem: true },
];

async function seed() {
  console.log('\n=== Seeding Permissions ===\n');

  // 0. Seed roles
  for (const roleDef of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description, isSystem: roleDef.isSystem },
      create: roleDef,
    });
  }
  console.log(`Seeded ${DEFAULT_ROLES.length} roles`);

  // 1. Create all permissions
  const createdPerms: Record<string, string> = {};
  for (const def of PERMISSION_DEFS) {
    const perm = await prisma.permission.upsert({
      where: { name: def.name },
      update: { module: def.module, action: def.action, description: def.description },
      create: def,
    });
    createdPerms[def.name] = perm.id;
  }
  console.log(`Created ${Object.keys(createdPerms).length} permissions`);

  // 2. Assign permissions to roles
  let totalAssignments = 0;
  for (const [role, patterns] of Object.entries(ROLE_PERMISSIONS)) {
    // Resolve wildcard patterns to concrete permission names
    const resolvedNames = new Set<string>();
    for (const pattern of patterns) {
      if (pattern.endsWith(':*')) {
        const module = pattern.replace(':*', '');
        for (const permName of Object.keys(createdPerms)) {
          if (permName.startsWith(`${module}:`)) {
            resolvedNames.add(permName);
          }
        }
      } else {
        resolvedNames.add(pattern);
      }
    }

    // Remove existing role permissions and reassign
    const existingRolePerms = await prisma.rolePermission.findMany({
      where: { role: role as any },
      select: { permissionId: true },
    });
    const existingIds = new Set(existingRolePerms.map(rp => rp.permissionId));

    for (const permName of resolvedNames) {
      const permId = createdPerms[permName];
      if (permId && !existingIds.has(permId)) {
        await prisma.rolePermission.create({
          data: { role: role as any, permissionId: permId },
        });
        totalAssignments++;
      }
    }
  }
  console.log(`Assigned ${totalAssignments} new role-permission mappings`);

  // 3. Ensure SUPERADMIN user has all permissions implicitly (handled by middleware)
  console.log('SUPERADMIN implicitly has all permissions via middleware (*:*)');

  console.log('\n=== Permission seeding complete ===\n');
}

export { seed };

// Allow standalone execution
if (require.main === module) {
  seed()
    .catch(e => { console.error('Seed failed:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
