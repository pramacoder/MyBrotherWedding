const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const initialGuests = [
    { name: 'Andi', slug: 'andi', invitation: 'Personal' },
    { name: 'Budi', slug: 'budi', invitation: 'Personal' },
    { name: 'Keluarga Besar', slug: 'keluarga-besar', invitation: 'Group' },
    { name: 'Teman Kampus', slug: 'teman-kampus', invitation: 'Group' }
  ];

  console.log('Seeding tabel guests...');
  for (const guest of initialGuests) {
    await prisma.guest.upsert({
      where: { slug: guest.slug },
      update: { name: guest.name, invitation: guest.invitation },
      create: guest
    });
  }
  console.log('Seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
