import { prisma } from '../src/config/database';

const templates = [
  {
    type: 'ink_expiry',
    subject: '⚠️ Ink Batch Near Expiry: {{batchId}}',
    body: '<h2>Ink Batch Expiry Alert</h2><p>Batch <strong>{{batchId}}</strong> ({{color}}) expires in <strong>{{daysLeft}} day(s)</strong>.</p><p>Expiry date: {{expiryDate}}</p><p>Remaining: {{remaining}}kg</p>',
    channels: ['email', 'websocket'],
    language: 'en',
  },
  {
    type: 'cylinder_maintenance',
    subject: '🔧 Cylinder Maintenance: {{cylinderId}}',
    body: '<h2>Cylinder Maintenance Alert</h2><p>Cylinder <strong>{{cylinderId}}</strong> ({{colorName}}) needs attention.</p><p>Status: {{status}}</p><p>Meter: {{meter}}m</p>',
    channels: ['email', 'websocket'],
    language: 'en',
  },
  {
    type: 'workflow_approval',
    subject: '📋 Approval Required: {{title}}',
    body: '<h2>Approval Request</h2><p><strong>{{title}}</strong> requires your approval.</p><p>Type: {{refType}}</p><p>Initiator: {{initiator}}</p><p><a href="{{appUrl}}/approvals/{{instanceId}}">Review in App</a></p>',
    channels: ['email', 'websocket', 'line', 'telegram'],
    language: 'en',
  },
  {
    type: 'alert',
    subject: '[{{severity}}] {{alertName}}',
    body: '<h2>Alert: {{alertName}}</h2><p><strong>Severity:</strong> {{severity}}</p><p><strong>Status:</strong> {{status}}</p><p>{{summary}}</p><p>{{description}}</p><p><small>Instance: {{instance}} | Time: {{startsAt}}</small></p>',
    channels: ['email', 'websocket'],
    language: 'en',
  },
  {
    type: 'test',
    subject: 'Test Notification from iSmart Gravure',
    body: '<h2>Test Notification</h2><p>This is a test notification sent to {{username}}.</p><p>If you received this, the notification system is working correctly.</p>',
    channels: ['email', 'websocket', 'line', 'telegram'],
    language: 'en',
  },
];

async function main() {
  console.log('Seeding notification templates...');
  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { type: t.type },
      update: { subject: t.subject, body: t.body, channels: t.channels, language: t.language },
      create: t,
    });
    console.log(`  Created/Updated: ${t.type}`);
  }
  console.log('Done.');
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
