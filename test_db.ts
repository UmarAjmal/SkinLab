import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAuth(email: string, pass: string) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    include: { role: true },
  });
  if (!user) {
    console.log(`[TEST] User not found: ${email}`);
    return;
  }
  const isMatch = await bcrypt.compare(pass, user.password);
  console.log(`[TEST] Login for ${email} with '${pass}': ${isMatch ? 'SUCCESS (Authenticated)' : 'FAILED'}, Role: ${user.role.name}`);
}

async function main() {
  await checkAuth('admin@skinlab.com', 'password123');
  await checkAuth('admin@skinlab.local', 'password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());

