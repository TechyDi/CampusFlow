const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const inst = await prisma.institution.findFirst({ where: { name: 'KEC COLLEGE' } });
    if (!inst) {
        console.log('Not found');
        return;
    }
    try {
        await prisma.institution.delete({ where: { id: inst.id } });
        console.log('Success');
    } catch(e) {
        console.error('Error:', e.message);
    }
}

main().finally(() => prisma.$disconnect());
