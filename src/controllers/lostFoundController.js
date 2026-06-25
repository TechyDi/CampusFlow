const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createLostItem = async (req, res) => {
    const { type, itemName, description, location } = req.body;

    if (!type || !itemName || !description || !location) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const institutionId = req.user.institutionId;
        const studentId = req.user.id;

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => '/uploads/' + file.filename);
        }

        const newItem = await prisma.lostItem.create({
            data: {
                institutionId,
                studentId,
                type,
                itemName,
                description,
                location,
                imageUrls: JSON.stringify(imageUrls),
                status: 'ACTIVE'
            },
            include: { student: true }
        });

        res.status(201).json({
            id: newItem.id.substring(0, 8),
            type: newItem.type,
            itemName: newItem.itemName,
            description: newItem.description,
            location: newItem.location,
            dateReported: newItem.dateReported,
            status: newItem.status,
            reporter: newItem.student.name
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const resolveLostItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const studentId = req.user.id;

        const item = await prisma.lostItem.findUnique({ where: { id: itemId } });
        
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        // Only allow the original reporter to resolve it, or an admin (ignoring admin for simplicity now)
        if (item.studentId !== studentId) return res.status(403).json({ error: 'Unauthorized' });

        await prisma.lostItem.update({
            where: { id: itemId },
            data: { status: 'RESOLVED' }
        });

        res.status(200).json({ success: true, message: 'Item marked as resolved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createLostItem, resolveLostItem };
