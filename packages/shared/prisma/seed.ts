import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
	// Hash passwords for security
	const adminPassword = await bcrypt.hash('admin123', 10); // Replace 'admin123' with your desired admin password
	const staffPassword = await bcrypt.hash('staff123', 10); // Replace 'staff123' with your desired staff password

	// Create an admin user
	const adminUser = await prisma.user.upsert({
		where: { email: 'admin@chaya.com' }, // Replace with your desired admin email
		update: {},
		create: {
			email: 'admin@chaya.com', // Replace with your desired admin email
			password: adminPassword,
			name: 'Admin User',
			role: 'ADMIN',
			isActive: true,
			isEnabled: true,
		},
	});

	// Create a staff user
	const staffUser = await prisma.user.upsert({
		where: { email: 'staff@chaya.com' }, // Replace with your desired staff email
		update: {},
		create: {
			email: 'staff@chaya.com', // Replace with your desired staff email
			password: staffPassword,
			name: 'Staff User',
			role: 'STAFF',
			isActive: true,
			isEnabled: true,
		},
	});

	console.log('Seed data created:');
	console.log({ adminUser, staffUser });
}

main();
