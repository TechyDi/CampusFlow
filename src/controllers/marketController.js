const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createListing = async (req, res) => {
    const { title, description, price, condition, contactInfo } = req.body;
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
        imageUrls = req.files.map(file => '/uploads/' + file.filename);
    }

    if (!title || !description || !price || !condition || !contactInfo) {
        return res.status(400).json({ error: 'All text fields are required' });
    }

    try {
        const institutionId = req.user.institutionId;
        const studentId = req.user.id;

        const newItem = await prisma.marketItem.create({
            data: {
                institutionId,
                studentId,
                title,
                description,
                price: parseFloat(price),
                condition,
                contactInfo,
                imageUrls: JSON.stringify(imageUrls),
                status: 'AVAILABLE'
            }
        });

        res.status(201).json({ success: true, item: newItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const markAsSold = async (req, res) => {
    try {
        const itemId = req.params.id;
        const studentId = req.user.id;

        const item = await prisma.marketItem.findUnique({ where: { id: itemId } });
        
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        // Only allow the original seller to mark as sold manually (if they sold it elsewhere)
        if (item.studentId !== studentId) return res.status(403).json({ error: 'Unauthorized' });

        await prisma.marketItem.update({
            where: { id: itemId },
            data: { status: 'SOLD' }
        });

        res.status(200).json({ success: true, message: 'Item marked as sold and buyer recorded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const editListing = async (req, res) => {
    const itemId = req.params.id;
    const { title, description, price, condition, contactInfo } = req.body;
    const studentId = req.user.id;

    try {
        const item = await prisma.marketItem.findUnique({ where: { id: itemId } });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.studentId !== studentId) return res.status(403).json({ error: 'Unauthorized' });

        const updateData = {
            title, description, price: parseFloat(price), condition, contactInfo
        };

        if (req.files && req.files.length > 0) {
            updateData.imageUrls = JSON.stringify(req.files.map(f => '/uploads/' + f.filename));
        }

        const updatedItem = await prisma.marketItem.update({
            where: { id: itemId },
            data: updateData
        });

        res.status(200).json({ success: true, item: updatedItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteListing = async (req, res) => {
    const itemId = req.params.id;
    const studentId = req.user.id;

    try {
        const item = await prisma.marketItem.findUnique({ where: { id: itemId } });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.studentId !== studentId) return res.status(403).json({ error: 'Unauthorized' });

        await prisma.marketItem.delete({ where: { id: itemId } });

        res.status(200).json({ success: true, message: 'Item deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const buyItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const buyerId = req.user.id;

        const item = await prisma.marketItem.findUnique({ 
            where: { id: itemId },
            include: { seller: true }
        });
        
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        if (item.status !== 'AVAILABLE') return res.status(400).json({ error: 'Item is no longer available' });
        
        if (item.studentId === buyerId) return res.status(400).json({ error: 'You cannot buy your own item' });

        const updatedItem = await prisma.marketItem.update({
            where: { id: itemId },
            data: { 
                status: 'SOLD',
                buyerId: buyerId
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'You have successfully claimed this item!',
            sellerContact: item.contactInfo
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const messageSeller = async (req, res) => {
    try {
        const itemId = req.params.id;
        const buyerId = req.user.id;
        const { message } = req.body;

        if (!message) return res.status(400).json({ error: 'Message is required' });

        const item = await prisma.marketItem.findUnique({ 
            where: { id: itemId },
            include: { seller: true }
        });
        
        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.studentId === buyerId) return res.status(400).json({ error: 'You cannot message yourself' });

        await prisma.message.create({
            data: {
                senderId: buyerId,
                receiverId: item.studentId,
                content: `Regarding "${item.title}": ${message}`
            }
        });

        res.status(200).json({ success: true, message: 'Message sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createListing, markAsSold, buyItem, editListing, deleteListing, messageSeller };
