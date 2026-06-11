import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
console.log('permission:', !!p.permission);
console.log('rolePermission:', !!p.rolePermission);
console.log('scope:', !!p.scope);
console.log('models:', Object.keys(p).filter(k => k.startsWith('u') || k.startsWith('p') || k.startsWith('r') || k.startsWith('s')).join(', '));
await p.$disconnect();
