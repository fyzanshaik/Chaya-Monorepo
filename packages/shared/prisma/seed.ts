import { PrismaClient, Gender, Relationship, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.$transaction([
    prisma.drying.deleteMany({}),
    prisma.processing.deleteMany({}),
    prisma.procurement.deleteMany({}),
    prisma.field.deleteMany({}),
    prisma.farmerDocuments.deleteMany({}),
    prisma.bankDetails.deleteMany({}),
    prisma.farmer.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.ping.deleteMany({}),
  ]);
  console.log('Database cleared successfully!');

  // Create a ping for testing
  await prisma.ping.create({
    data: {},
  });

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@chaya.com' },
    update: {},
    create: {
      email: 'admin@chaya.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      isActive: true,
      isEnabled: true,
      lastLoginAt: new Date(),
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@chaya.com' },
    update: {},
    create: {
      email: 'staff@chaya.com',
      password: staffPassword,
      name: 'Staff User',
      role: Role.STAFF,
      isActive: true,
      isEnabled: true,
      lastLoginAt: new Date(),
    },
  });

  // Create additional staff users
  const additionalStaff = [];
  for (let i = 0; i < 5; i++) {
    const staffPwd = await bcrypt.hash('password123', 10);
    const staff = await prisma.user.create({
      data: {
        email: `staff${i + 1}@chaya.com`,
        password: staffPwd,
        name: faker.person.fullName(),
        role: Role.STAFF,
        isActive: faker.datatype.boolean(0.9), // 90% active
        isEnabled: faker.datatype.boolean(0.95), // 95% enabled
        lastLoginAt: faker.date.recent(),
      },
    });
    additionalStaff.push(staff);
  }

  console.log('User seed data created:');
  console.log({ adminUser, staffUser, additionalStaff });

  const totalFarmers = 50;
  console.log(`Generating ${totalFarmers} random farmer records...`);

  const indianStates = [
    'Andhra Pradesh',
    'Karnataka',
    'Tamil Nadu',
    'Telangana',
    'Kerala',
    'Maharashtra',
    'Gujarat',
    'Punjab',
    'Haryana',
    'Uttar Pradesh',
  ];

  const getDistricts = (state: string) => {
    const districts: Record<string, string[]> = {
      'Andhra Pradesh': ['Visakhapatnam', 'Guntur', 'Krishna', 'East Godavari', 'West Godavari'],
      Karnataka: ['Bangalore Urban', 'Mysore', 'Belgaum', 'Gulbarga', 'Bellary'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
      Telangana: ['Hyderabad', 'Rangareddy', 'Warangal', 'Karimnagar', 'Khammam'],
      Kerala: ['Thiruvananthapuram', 'Ernakulam', 'Kozhikode', 'Thrissur', 'Kollam'],
      Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
      Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
      Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
      Haryana: ['Gurgaon', 'Faridabad', 'Hisar', 'Rohtak', 'Panipat'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut'],
    };

    return districts[state] || ['District 1', 'District 2', 'District 3'];
  };

  const communities = ['OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'SC', 'ST'];

  const bankNames = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'Bank of India',
    'Indian Bank',
  ];

  const crops = [
    'Rice',
    'Wheat',
    'Cotton',
    'Sugarcane',
    'Maize',
    'Pulses',
    'Millets',
    'Oilseeds',
    'Spices',
    'Vegetables',
  ];

  const procuredForms = ['Raw', 'Dried', 'Processed', 'Semi-processed', 'Cleaned'];

  const specialities = [
    'Organic',
    'Traditional',
    'High-yield',
    'Premium',
    'Export quality',
    'Standard',
    'Chemical-free',
  ];

  const processMethods = ['wet', 'dry'];
  const procurementStatuses = ['IN_PROGRESS', 'FINISHED'];
  const allUsers = [adminUser, staffUser, ...additionalStaff];
  const createdFarmers = [];

  for (let i = 0; i < totalFarmers; i++) {
    const gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE, Gender.OTHER]) as Gender;
    const firstName = gender === Gender.MALE ? faker.person.firstName('male') : faker.person.firstName('female');
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    const state = faker.helpers.arrayElement(indianStates);
    const district = faker.helpers.arrayElement(getDistricts(state));
    const mandal = faker.location.county();
    const village = faker.location.city();
    const panchayath = `${village} Panchayath`;

    const dateOfBirth = faker.date.birthdate({ min: 18, max: 85, mode: 'age' });
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();

    const surveyNumber = `SRV-${faker.string.alphanumeric(8).toUpperCase()}`;
    const aadharNumber = faker.string.numeric(12);

    try {
      const farmer = await prisma.farmer.create({
        data: {
          surveyNumber,
          name,
          relationship: faker.helpers.arrayElement([
            Relationship.SELF,
            Relationship.SPOUSE,
            Relationship.CHILD,
            Relationship.OTHER,
          ]) as Relationship,
          gender,
          community: faker.helpers.arrayElement(communities),
          aadharNumber,
          state,
          district,
          mandal,
          village,
          panchayath,
          dateOfBirth,
          age,
          contactNumber: faker.string.numeric(10),
          isActive: faker.datatype.boolean(0.9), // 90% active
          createdById: faker.helpers.arrayElement(allUsers).id,
          updatedById: faker.helpers.arrayElement(allUsers).id,

          bankDetails: {
            create: {
              bankName: faker.helpers.arrayElement(bankNames),
              branchName: `${faker.location.city()} Branch`,
              ifscCode: `${faker.string.alpha(4).toUpperCase()}0${faker.string.numeric(6)}`,
              accountNumber: faker.string.numeric(faker.number.int({ min: 9, max: 18 })),
              bankCode: faker.string.alphanumeric(11).toUpperCase(),
              address: faker.location.streetAddress(),
            },
          },

          documents: {
            create: {
              profilePicUrl: faker.image.avatar(),
              aadharDocUrl: `https://storage.example.com/documents/aadhar-${faker.string.uuid()}.pdf`,
              bankDocUrl: `https://storage.example.com/documents/bank-${faker.string.uuid()}.pdf`,
            },
          },

          fields: {
            create: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
              areaHa: parseFloat(faker.number.float({ min: 0.5, max: 10, fractionDigits: 2 }).toFixed(2)),
              yieldEstimate: parseFloat(faker.number.float({ min: 2, max: 15, fractionDigits: 1 }).toFixed(1)),

              location: {
                type: 'Point',
                coordinates: [faker.location.longitude(), faker.location.latitude()],
              },
              landDocumentUrl: `https://storage.example.com/documents/land-${faker.string.uuid()}.pdf`,
            })),
          },
        },
      });

      createdFarmers.push(farmer);
      console.log(`Created farmer ${i + 1}/${totalFarmers}: ${farmer.name}`);
    } catch (error) {
      console.error(`Error creating farmer ${i + 1}:`, error);
    }
  }

  // Create procurements, processing, and drying records
  console.log('Creating procurement, processing, and drying records...');

  // Not all farmers will have procurement records
  const farmersWithProcurement = faker.helpers.arrayElements(
    createdFarmers,
    Math.floor(createdFarmers.length * 0.7) // 70% of farmers have procurements
  );

  for (const farmer of farmersWithProcurement) {
    // Each farmer might have multiple procurement records
    const procurementCount = faker.number.int({ min: 1, max: 3 });

    for (let p = 0; p < procurementCount; p++) {
      const crop = faker.helpers.arrayElement(crops);
      const procuredForm = faker.helpers.arrayElement(procuredForms);
      const speciality = faker.helpers.arrayElement(specialities);
      const quantity = parseFloat(faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }).toFixed(2));
      const lotNo = faker.number.int({ min: 1000, max: 9999 });
      const batchCode = `BATCH-${farmer.id}-${lotNo}-${faker.string.alphanumeric(4).toUpperCase()}`;

      try {
        const procurement = await prisma.procurement.create({
          data: {
            farmerId: farmer.id,
            crop,
            procuredForm,
            speciality,
            quantity,
            batchCode,
            date: faker.date.recent({ days: 90 }),
            time: faker.date.recent({ days: 90 }),
            lotNo,
            procuredBy: faker.helpers.arrayElement(allUsers).name,
            vehicleNo: `${faker.string.alpha(2).toUpperCase()}-${faker.number.int({ min: 10, max: 99 })}-${faker.string.alpha(1).toUpperCase()}-${faker.number.int({ min: 1000, max: 9999 })}`,
          },
        });

        console.log(`Created procurement for ${farmer.name}: ${batchCode}`);

        // Create processing record for this procurement
        const processMethod = faker.helpers.arrayElement(processMethods);
        const processingQuantity = quantity * faker.number.float({ min: 0.9, max: 0.98, fractionDigits: 2 }); // Some loss in processing
        const batchNo = `PROC-${procurement.id}-${faker.string.alphanumeric(6).toUpperCase()}`;
        const dateOfProcessing = new Date(procurement.date);
        dateOfProcessing.setDate(dateOfProcessing.getDate() + faker.number.int({ min: 1, max: 5 }));

        const processing = await prisma.processing.create({
          data: {
            procurementId: procurement.id,
            lotNo: procurement.lotNo,
            batchNo,
            crop: procurement.crop,
            procuredForm: procurement.procuredForm,
            quantity: processingQuantity,
            speciality: procurement.speciality,
            processMethod,
            dateOfProcessing,
            dateOfCompletion: faker.helpers.maybe(() => {
              const completionDate = new Date(dateOfProcessing);
              completionDate.setDate(completionDate.getDate() + faker.number.int({ min: 3, max: 14 }));
              return completionDate;
            }),
            quantityAfterProcess: faker.helpers.maybe(
              () => processingQuantity * faker.number.float({ min: 0.85, max: 0.95, fractionDigits: 2 })
            ),
            doneBy: faker.helpers.arrayElement(allUsers).name,
            status: faker.helpers.arrayElement(procurementStatuses),
            processingCount: faker.number.int({ min: 1, max: 5 }),
          },
        });

        console.log(`Created processing record: ${batchNo}`);

        // Create drying records if process method is "dry"
        if (processMethod === 'dry') {
          const dryingDays = faker.number.int({ min: 3, max: 7 });

          for (let day = 1; day <= dryingDays; day++) {
            await prisma.drying.create({
              data: {
                processingId: processing.id,
                day,
                temperature: faker.number.float({
                  min: 25,
                  max: 40,
                  fractionDigits: 1,
                }),
                humidity: faker.number.float({
                  min: 40,
                  max: 80,
                  fractionDigits: 1,
                }),
                pH: faker.number.float({
                  min: 5.5,
                  max: 7.5,
                  fractionDigits: 1,
                }),
                moistureQuantity: faker.number.float({
                  min: 10,
                  max: 30,
                  fractionDigits: 1,
                }),
              },
            });
          }

          console.log(`Created ${dryingDays} drying records for processing ${batchNo}`);
        }
      } catch (error) {
        console.error(`Error creating procurement chain for farmer ${farmer.id}:`, error);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
