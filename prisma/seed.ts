import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createUserIfNotExists(
  email: string,
  role: UserRole,
  isSystem = false,
) {
  const existing = await prisma.users.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`${role} already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash('Test@123', 12);

  await prisma.users.create({
    data: {
      email,
      password_hash: passwordHash,
      full_name: `${role} account`,
      role,
      is_system: isSystem,
      email_verified: true,
      twofa_enabled: false,
    },
  });

  console.log(`Created ${role}: ${email}`);
}

async function main() {
  await createUserIfNotExists('super@garden.local', UserRole.super_admin, true);

  await createUserIfNotExists('admin@garden.local', UserRole.admin);

  await createUserIfNotExists('user@garden.local', UserRole.user);
}

void main().finally(async () => {
  await prisma.$disconnect();
});
