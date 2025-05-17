import { PrismaClient, Role, Gender, Relationship } from '@prisma/client';
import { hashPassword } from '../../../apps/api/src/lib/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const adminPassword = await hashPassword('Admin@123');
  const staffPassword = await hashPassword('Staff@123');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      isEnabled: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      name: 'Staff User',
      password: staffPassword,
      role: Role.STAFF,
      isEnabled: true,
    },
  });

  console.log({ adminUser, staffUser });

  // Seed Farmers (ensure createdById and updatedById are valid user IDs)
  const farmer1 = await prisma.farmer.upsert({
    where: { surveyNumber: 'FARM001' },
    update: {},
    create: {
      surveyNumber: 'FARM001',
      name: 'Raju Farmer',
      relationship: Relationship.SELF,
      gender: Gender.MALE,
      community: 'General',
      aadharNumber: '123456789012',
      state: 'Telangana',
      district: 'Warangal',
      mandal: 'Hanamkonda',
      village: 'Kazipet',
      panchayath: 'Kazipet GP',
      dateOfBirth: new Date('1980-01-01'),
      age: 44,
      contactNumber: '9876543210',
      createdById: adminUser.id,
      updatedById: adminUser.id,
      bankDetails: {
        create: {
          ifscCode: 'SBIN0000123',
          bankName: 'State Bank of India',
          branchName: 'Kazipet',
          accountNumber: '1122334455',
          address: 'Kazipet, Warangal',
          bankCode: 'SBI',
        },
      },
      documents: {
        create: {
          profilePicUrl: 'http://example.com/profile.jpg',
          aadharDocUrl: 'http://example.com/aadhar.pdf',
          bankDocUrl: 'http://example.com/bank.pdf',
        },
      },
    },
  });
  console.log({ farmer1 });

  // Seed Procurements
  const procurement1 = await prisma.procurement.upsert({
    where: { batchCode: 'RIC20240517001' }, // Procurement's own batch code
    update: {},
    create: {
      farmerId: farmer1.id,
      crop: 'Rice',
      procuredForm: 'Raw',
      speciality: 'Organic',
      quantity: 100.5,
      batchCode: 'RIC20240517001',
      date: new Date('2024-05-17T10:00:00.000Z'), // Procurement date
      time: new Date('2024-05-17T10:30:00.000Z'), // Procurement time (ensure this is a full DateTime)
      lotNo: 1,
      procuredBy: staffUser.name,
      vehicleNo: 'TS01AB1234',
      // processingBatchId will be null initially
    },
  });
  console.log({ procurement1 });

  const procurement2 = await prisma.procurement.upsert({
    where: { batchCode: 'RIC20240517002' },
    update: {},
    create: {
      farmerId: farmer1.id, // Same farmer, same lot, different procurement
      crop: 'Rice',
      procuredForm: 'Raw',
      speciality: 'Standard',
      quantity: 75.0,
      batchCode: 'RIC20240517002',
      date: new Date('2024-05-17T11:00:00.000Z'),
      time: new Date('2024-05-17T11:15:00.000Z'),
      lotNo: 1, // Same lot number as procurement1
      procuredBy: staffUser.name,
    },
  });
  console.log({ procurement2 });

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
