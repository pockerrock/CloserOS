import { PrismaClient, UserRole, DealStage } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // First, find or create the workspace
  let workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-workspace' },
  });

  if (workspace) {
    console.log('🧹 Cleaning up existing seed data...');

    // Delete in correct order due to foreign key constraints
    await prisma.activity.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.call.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.booking.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.deal.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.lead.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.document.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.documentEmbedding.deleteMany({
      where: { document: { workspaceId: workspace.id } }
    });

    console.log('✅ Cleaned up existing data');
  }

  // Create or update workspace
  workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      settings: {
        create: {
          defaultReminderMinutes: 60,
          enableSmsReminders: true,
          enableEmailReminders: true,
          enableRecording: true,
          autoStartRecording: true,
          enableAiSummary: true,
          enableRealTimeWhisper: false,
          noShowThresholdMinutes: 15,
          enableAutoRecovery: true,
        },
      },
    },
  });

  console.log('✅ Created workspace:', workspace.name);

  // Create users
  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Owner',
      role: UserRole.OWNER,
      workspaceId: workspace.id,
    },
  });

  const closer = await prisma.user.upsert({
    where: { email: 'closer@demo.com' },
    update: {},
    create: {
      email: 'closer@demo.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Closer',
      role: UserRole.CLOSER,
      workspaceId: workspace.id,
    },
  });

  const setter = await prisma.user.upsert({
    where: { email: 'setter@demo.com' },
    update: {},
    create: {
      email: 'setter@demo.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Setter',
      role: UserRole.SETTER,
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Created users: owner, closer, setter');

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '+1234567890',
      timezone: 'America/New_York',
      source: 'Website',
      workspaceId: workspace.id,
      createdById: setter.id,
      assignedToId: closer.id,
      notes: 'Interested in premium coaching package',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phone: '+1987654321',
      timezone: 'America/Los_Angeles',
      source: 'Referral',
      workspaceId: workspace.id,
      createdById: setter.id,
      assignedToId: closer.id,
      notes: 'Referred by existing client',
    },
  });

  console.log('✅ Created sample leads');

  // Create sample deals
  const deal1 = await prisma.deal.create({
    data: {
      leadId: lead1.id,
      workspaceId: workspace.id,
      closerId: closer.id,
      stage: DealStage.SCHEDULED,
      amount: 5000,
      currency: 'USD',
      notes: 'Premium package - 12 months',
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      leadId: lead2.id,
      workspaceId: workspace.id,
      closerId: closer.id,
      stage: DealStage.QUALIFIED,
      amount: 3000,
      currency: 'USD',
      notes: 'Standard package - 6 months',
    },
  });

  console.log('✅ Created sample deals');

  // Create sample booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const booking = await prisma.booking.create({
    data: {
      leadId: lead1.id,
      workspaceId: workspace.id,
      scheduledAt: tomorrow,
      duration: 60,
      timezone: 'America/New_York',
      confirmed: true,
      bookingToken: 'demo-booking-token-123',
      notes: 'Discovery call',
    },
  });

  console.log('✅ Created sample booking');

  // Create sample document
  const document = await prisma.document.create({
    data: {
      workspaceId: workspace.id,
      fileName: 'sales-script.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000,
      s3Key: 'documents/demo/sales-script.pdf',
      s3Url: 'https://example.com/sales-script.pdf',
      extractedText: 'This is a sample sales script for high-ticket coaching...',
      embeddingStatus: 'pending',
      description: 'Main sales script for coaching program',
      tags: ['sales', 'script', 'coaching'],
    },
  });

  console.log('✅ Created sample document');

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('📝 Demo credentials:');
  console.log('   Owner:  owner@demo.com / password123');
  console.log('   Closer: closer@demo.com / password123');
  console.log('   Setter: setter@demo.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
