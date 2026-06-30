const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.course.deleteMany({});
    console.log("Deleted courses");
}
main().finally(() => prisma.$disconnect());
