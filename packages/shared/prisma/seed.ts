import { PrismaClient, Gender, Relationship } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  // Hash passwords for security
  const adminPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  // Create an admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@chaya.com" },
    update: {},
    create: {
      email: "admin@chaya.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
      isActive: true,
      isEnabled: true,
    },
  });

  // Create a staff user
  const staffUser = await prisma.user.upsert({
    where: { email: "staff@chaya.com" },
    update: {},
    create: {
      email: "staff@chaya.com",
      password: staffPassword,
      name: "Staff User",
      role: "STAFF",
      isActive: true,
      isEnabled: true,
    },
  });

  console.log("User seed data created:");
  console.log({ adminUser, staffUser });

  // Generate random farmers with related data
  const totalFarmers = 50;
  console.log(`Generating ${totalFarmers} random farmer records...`);

  // Indian states and districts for realistic data
  const indianStates = [
    "Andhra Pradesh",
    "Karnataka",
    "Tamil Nadu",
    "Telangana",
    "Kerala",
    "Maharashtra",
    "Gujarat",
    "Punjab",
    "Haryana",
    "Uttar Pradesh",
  ];

  const getDistricts = (state: string) => {
    const districts: Record<string, string[]> = {
      "Andhra Pradesh": [
        "Visakhapatnam",
        "Guntur",
        "Krishna",
        "East Godavari",
        "West Godavari",
      ],
      Karnataka: [
        "Bangalore Urban",
        "Mysore",
        "Belgaum",
        "Gulbarga",
        "Bellary",
      ],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"],
      Telangana: [
        "Hyderabad",
        "Rangareddy",
        "Warangal",
        "Karimnagar",
        "Khammam",
      ],
      Kerala: [
        "Thiruvananthapuram",
        "Ernakulam",
        "Kozhikode",
        "Thrissur",
        "Kollam",
      ],
      Maharashtra: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
      Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
      Punjab: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
      Haryana: ["Gurgaon", "Faridabad", "Hisar", "Rohtak", "Panipat"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut"],
    };

    return districts[state] || ["District 1", "District 2", "District 3"];
  };

  // Communities for realistic data
  const communities = [
    "OC",
    "BC-A",
    "BC-B",
    "BC-C",
    "BC-D",
    "BC-E",
    "SC",
    "ST",
  ];

  // Bank names
  const bankNames = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Bank of India",
    "Indian Bank",
  ];

  // Create farmers
  for (let i = 0; i < totalFarmers; i++) {
    const gender = faker.helpers.arrayElement([
      Gender.MALE,
      Gender.FEMALE,
      Gender.OTHER,
    ]) as Gender;
    const firstName =
      gender === Gender.MALE
        ? faker.person.firstName("male")
        : faker.person.firstName("female");
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    const state = faker.helpers.arrayElement(indianStates);
    const district = faker.helpers.arrayElement(getDistricts(state));
    const mandal = faker.location.county();
    const village = faker.location.city();
    const panchayath = `${village} Panchayath`;

    const dateOfBirth = faker.date.birthdate({ min: 18, max: 85, mode: "age" });
    const age = new Date().getFullYear() - dateOfBirth.getFullYear();

    // Create unique survey number and Aadhar number
    const surveyNumber = `SRV-${faker.string.alphanumeric(8).toUpperCase()}`;
    const aadharNumber = faker.string.numeric(12); // 12-digit Aadhar

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
          contactNumber: faker.string.numeric(10), // 10-digit phone number
          isActive: true,
          createdById: faker.helpers.arrayElement([adminUser.id, staffUser.id]),
          updatedById: faker.helpers.arrayElement([adminUser.id, staffUser.id]),

          // Create bank details
          bankDetails: {
            create: {
              bankName: faker.helpers.arrayElement(bankNames),
              branchName: `${faker.location.city()} Branch`,
              ifscCode: `${faker.string.alpha(4).toUpperCase()}0${faker.string.numeric(6)}`,
              accountNumber: faker.string.numeric(
                faker.number.int({ min: 9, max: 18 })
              ),
              bankCode: faker.string.alphanumeric(11).toUpperCase(),
              address: faker.location.streetAddress(),
            },
          },

          // Create documents
          documents: {
            create: {
              profilePicUrl: faker.image.avatar(),
              aadharDocUrl: `https://storage.example.com/documents/aadhar-${faker.string.uuid()}.pdf`,
              bankDocUrl: `https://storage.example.com/documents/bank-${faker.string.uuid()}.pdf`,
            },
          },

          // Create 1-3 fields for each farmer
          fields: {
            create: Array.from(
              { length: faker.number.int({ min: 1, max: 3 }) },
              () => ({
                areaHa: parseFloat(
                  faker.number
                    .float({ min: 0.5, max: 10, fractionDigits: 2 })
                    .toFixed(2)
                ),
                yieldEstimate: parseFloat(
                  faker.number
                    .float({ min: 2, max: 15, fractionDigits: 1 })
                    .toFixed(1)
                ),

                // Location as GeoJSON Point
                location: {
                  type: "Point",
                  coordinates: [
                    faker.location.longitude(),
                    faker.location.latitude(),
                  ],
                },
                landDocumentUrl: `https://storage.example.com/documents/land-${faker.string.uuid()}.pdf`,
              })
            ),
          },
        },
      });

      console.log(`Created farmer ${i + 1}/${totalFarmers}: ${farmer.name}`);
    } catch (error) {
      console.error(`Error creating farmer ${i + 1}:`, error);
    }
  }

  console.log("Seed completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
