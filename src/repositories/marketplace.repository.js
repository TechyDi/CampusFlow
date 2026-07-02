const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MarketplaceRepository {
    async createItem(data) {
        return await prisma.marketItem.create({ data });
    }

    async findItemById(id) {
        return await prisma.marketItem.findUnique({ 
            where: { id },
            include: { seller: true }
        });
    }

    async updateItem(id, data) {
        return await prisma.marketItem.update({
            where: { id },
            data
        });
    }

    async deleteItem(id) {
        return await prisma.marketItem.delete({ where: { id } });
    }

    async createMessage(data) {
        return await prisma.message.create({ data });
    }

    async createNotification(data) {
        return await prisma.notification.create({ data });
    }
}

module.exports = new MarketplaceRepository();