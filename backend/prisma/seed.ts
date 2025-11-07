import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin User
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@companydocs.com' },
    update: {},
    create: {
      email: 'admin@companydocs.com',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+966501234567',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created Super Admin:', admin.email);

  // Create Supervisor User
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@companydocs.com' },
    update: {},
    create: {
      email: 'supervisor@companydocs.com',
      passwordHash: await bcrypt.hash('Supervisor@123', 12),
      firstName: 'Supervisor',
      lastName: 'User',
      phone: '+966502345678',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created Supervisor:', supervisor.email);

  // Create Employee User
  const employee = await prisma.user.upsert({
    where: { email: 'employee@companydocs.com' },
    update: {},
    create: {
      email: 'employee@companydocs.com',
      passwordHash: await bcrypt.hash('Employee@123', 12),
      firstName: 'Employee',
      lastName: 'User',
      phone: '+966503456789',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created Employee:', employee.email);

  // Create Sample Company
  const company = await prisma.company.create({
    data: {
      name: 'شركة الأمل للتجارة',
      nameArabic: 'شركة الأمل للتجارة',
      description: 'شركة متخصصة في التجارة العامة',
      companyType: 'LLC',
      commercialRegistration: '1234567890',
      taxNumber: '300123456789003',
      establishmentDate: new Date('2020-01-15'),
      country: 'السعودية',
      city: 'الرياض',
      district: 'العليا',
      primaryEmail: 'info@alamal.com',
      primaryPhone: '+966112345678',
      status: 'IN_PROGRESS',
      completionPercentage: 0,
      ownerId: employee.id,
      tags: ['تجارة', 'عامة'],
    },
  });

  console.log('✅ Created Sample Company:', company.name);

  console.log('🎉 Database seeding completed!');
  console.log('\n📋 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin:');
  console.log('  Email: admin@companydocs.com');
  console.log('  Password: Admin@123');
  console.log('\nSupervisor:');
  console.log('  Email: supervisor@companydocs.com');
  console.log('  Password: Supervisor@123');
  console.log('\nEmployee:');
  console.log('  Email: employee@companydocs.com');
  console.log('  Password: Employee@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

