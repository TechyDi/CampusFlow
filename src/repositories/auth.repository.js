const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuthRepository {
    async findUserByEmail(email) {
        return await prisma.user.findUnique({ where: { email } });
    }

    async createUser(data) {
        return await prisma.user.create({ data });
    }

    async findInstitutionsForSignup() {
        return await prisma.institution.findMany({
            where: {
                name: {
                    notIn: ['CampusFlow HQ', 'CAMPUSFLOW HQ', 'Campusflow HQ']
                }
            },
            select: { id: true, name: true }
        });
    }

    async findAdminsForInstitution(institutionId) {
        return await prisma.user.findMany({
            where: { institutionId, role: 'ADMIN' }
        });
    }

    async createNotifications(data) {
        return await prisma.notification.createMany({ data });
    }
}

module.exports = new AuthRepository();
