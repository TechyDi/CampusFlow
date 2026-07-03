const LostFoundRepository = require('../repositories/lostFound.repository');
const AppError = require('../utils/AppError');
const { logger } = require('../logger');

class LostFoundService {
    async createLostItem(institutionId, studentId, data, files) {
        let imageUrls = [];
        if (files && files.length > 0) {
            imageUrls = files.map(file => '/uploads/' + file.filename);
        }

        const newItem = await LostFoundRepository.createItem({
            institutionId,
            studentId,
            type: data.type,
            itemName: data.itemName,
            description: data.description,
            location: data.location,
            imageUrls: JSON.stringify(imageUrls),
            status: 'ACTIVE'
        });

        logger.info(`Lost and Found item created`, { category: logger.categories.HTTP, itemId: newItem.id });
        
        return {
            id: newItem.id.substring(0, 8),
            type: newItem.type,
            itemName: newItem.itemName,
            description: newItem.description,
            location: newItem.location,
            dateReported: newItem.dateReported,
            status: newItem.status,
            reporter: newItem.student.name
        };
    }

    async resolveLostItem(itemId, studentId) {
        const item = await LostFoundRepository.findItemById(itemId);
        
        if (!item) throw new AppError(404, 'Item not found');
        if (item.studentId !== studentId) throw new AppError(403, 'Unauthorized');

        await LostFoundRepository.updateItem(itemId, { status: 'RESOLVED' });
        logger.info(`Lost and Found item resolved`, { category: logger.categories.HTTP, itemId });
    }
}

module.exports = new LostFoundService();