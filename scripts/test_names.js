const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const insts = await prisma.institution.findMany({ select: { name: true } });
    console.log(insts);
}
main().finally(() => prisma.$disconnect());
