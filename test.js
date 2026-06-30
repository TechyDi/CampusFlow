const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
    try {
        const warden = await prisma.user.findFirst({ where: { role: 'WARDEN' } });
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        const complaint = await prisma.complaint.findFirst();

        if(!warden || !complaint) return console.log('Missing data');

        const tokenWarden = jwt.sign(
            { id: warden.id, email: warden.email, role: warden.role, institutionId: warden.institutionId },
            process.env.JWT_SECRET || 'supersecret_for_local_dev'
        );

        console.log('Testing Warden:');
        const res1 = await fetch('http://localhost:3000/api/staff/complaints/' + complaint.id + '/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Cookie': 'token=' + tokenWarden },
            body: JSON.stringify({ status: 'RESOLVED' })
        });
        console.log(res1.status, await res1.text());

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
