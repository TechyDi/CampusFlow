const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class LostFoundRepository {
    async createItem(data) {
        return await prisma.lostItem.create({
            data,
            include: { student: true }
        });
    }

    async findItemById(id) {
        return await prisma.lostItem.findUnique({ where: { id } });
    }

    async updateItem(id, data) {
        return await prisma.lostItem.update({
            where: { id },
            data
        });
    }
}

module.exports = new LostFoundRepository();