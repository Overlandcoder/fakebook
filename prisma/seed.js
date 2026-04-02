const { PrismaClient } = require("../generated/prisma");
const { faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding 10 users...");

  for (let i = 0; i < 10; i++) {
    await prisma.user.create({
      data: {
        username: faker.internet.username(),
        email: faker.internet.email(),
        password: "password123",
        posts: {
          create: [
            { content: faker.lorem.sentence() },
            { content: faker.lorem.paragraph() },
          ],
        },
      },
    });
  }

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
