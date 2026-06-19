import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPasswordHash = await bcrypt.hash('password123', 10)
  const staffPasswordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Owner',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'owner',
    },
  })

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      name: 'Staff Member',
      username: 'staff',
      passwordHash: staffPasswordHash,
      role: 'staff',
    },
  })

  let mobilesCategory = await prisma.category.findFirst({
    where: { name: "Mobiles" },
  });
  if (!mobilesCategory) {
    mobilesCategory = await prisma.category.create({
      data: { name: "Mobiles" },
    });
  }

  let accessoriesCategory = await prisma.category.findFirst({
    where: { name: "Accessories" },
  });
  if (!accessoriesCategory) {
    accessoriesCategory = await prisma.category.create({
      data: { name: "Accessories" },
    });
  }

  console.log({ admin, staff, mobilesCategory, accessoriesCategory })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
