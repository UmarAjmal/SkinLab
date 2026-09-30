import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@skinlab.com', role: 'Admin' },
    { email: 'admin@skinlab.local', role: 'Admin' },
    { email: 'manager@skinlab.com', role: 'Manager' },
    { email: 'doctor@skinlab.com', role: 'Doctor' },
    { email: 'cashier@skinlab.com', role: 'Cashier' },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      let role = await prisma.role.findUnique({ where: { name: u.role } });
      if (!role) {
        role = await prisma.role.create({ data: { name: u.role } });
      }

      await prisma.user.create({
        data: {
          email: u.email,
          password: hashedPassword,
          role_id: role.id,
        }
      });
      console.log(`Created user: ${u.email} with role: ${u.role}`);
    } else {
      console.log(`User already exists: ${u.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
