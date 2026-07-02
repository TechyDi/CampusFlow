const MarketplaceRepository = require('../repositories/marketplace.repository');
const AppError = require('../utils/AppError');
const logger = require('../logger');

class MarketplaceService {
    async createListing(institutionId, studentId, data, files) {
        let imageUrls = [];
        if (files && files.length > 0) {
            imageUrls = files.map(file => '/uploads/' + file.filename);
        }

        const newItem = await MarketplaceRepository.createItem({
            institutionId,
            studentId,
            title: data.title,
            description: data.description,
            price: parseFloat(data.price),
            condition: data.condition,
            contactInfo: data.contactInfo,
            imageUrls: JSON.stringify(imageUrls),
            status: 'AVAILABLE'
        });

        logger.info(`Marketplace item created`, { category: logger.categories.HTTP, itemId: newItem.id });
        return newItem;
    }

    async markAsSold(itemId, studentId) {
        const item = await MarketplaceRepository.findItemById(itemId);
        
        if (!item) throw new AppError(404, 'Item not found');
        if (item.studentId !== studentId) throw new AppError(403, 'Unauthorized');

        await MarketplaceRepository.updateItem(itemId, { status: 'SOLD' });
        logger.info(`Marketplace item marked as sold`, { category: logger.categories.HTTP, itemId });
    }

    async editListing(itemId, studentId, data, files) {
        const item = await MarketplaceRepository.findItemById(itemId);
        
        if (!item) throw new AppError(404, 'Item not found');
        if (item.studentId !== studentId) throw new AppError(403, 'Unauthorized');

        const updateData = {
            title: data.title, 
            description: data.description, 
            price: parseFloat(data.price), 
            condition: data.condition, 
            contactInfo: data.contactInfo
        };

        if (files && files.length > 0) {
            updateData.imageUrls = JSON.stringify(files.map(f => '/uploads/' + f.filename));
        }

        const updatedItem = await MarketplaceRepository.updateItem(itemId, updateData);
        logger.info(`Marketplace item edited`, { category: logger.categories.HTTP, itemId });
        return updatedItem;
    }

    async deleteListing(itemId, studentId) {
        const item = await MarketplaceRepository.findItemById(itemId);
        if (!item) throw new AppError(404, 'Item not found');
        if (item.studentId !== studentId) throw new AppError(403, 'Unauthorized');

        await MarketplaceRepository.deleteItem(itemId);
        logger.info(`Marketplace item deleted`, { category: logger.categories.HTTP, itemId });
    }

    async buyItem(itemId, buyerId) {
        const item = await MarketplaceRepository.findItemById(itemId);
        
        if (!item) throw new AppError(404, 'Item not found');
        if (item.status !== 'AVAILABLE') throw new AppError(400, 'Item is no longer available');
        if (item.studentId === buyerId) throw new AppError(400, 'You cannot buy your own item');

        await MarketplaceRepository.updateItem(itemId, { 
            status: 'SOLD',
            buyerId: buyerId
        });

        logger.info(`Marketplace item bought`, { category: logger.categories.HTTP, itemId, buyerId });
        return item.contactInfo;
    }

    async messageSeller(itemId, buyerId, message) {
        const item = await MarketplaceRepository.findItemById(itemId);
        
        if (!item) throw new AppError(404, 'Item not found');
        if (item.studentId === buyerId) throw new AppError(400, 'You cannot message yourself');

        await MarketplaceRepository.createMessage({
            senderId: buyerId,
            receiverId: item.studentId,
            content: `Regarding "${item.title}": ${message}`
        });

        await MarketplaceRepository.createNotification({
            userId: item.studentId,
            title: 'New Marketplace Message',
            message: `You received a message regarding "${item.title}".`,
            link: '/marketplace'
        });

        logger.info(`Marketplace message sent`, { category: logger.categories.HTTP, itemId, buyerId });
    }
}

module.exports = new MarketplaceService();