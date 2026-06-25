const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const joinQueue = async (req, res) => {
    const { queueId } = req.body;
    
    if (!queueId) return res.status(400).json({ error: 'Queue ID is required' });

    try {
        const studentId = req.user.id;
        
        // Ensure student isn't already waiting in this exact queue
        const existingTicket = await prisma.queueTicket.findFirst({
            where: { queueId, studentId, status: 'WAITING' }
        });
        
        if (existingTicket) {
            return res.status(400).json({ error: 'You are already in this queue.' });
        }

        const ticket = await prisma.queueTicket.create({
            data: {
                queueId,
                studentId,
                status: 'WAITING'
            }
        });

        res.status(201).json({ success: true, ticket });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const leaveQueue = async (req, res) => {
    const ticketId = req.params.id;
    const studentId = req.user.id;

    try {
        const ticket = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        
        // Prevent canceling other people's tickets
        if (ticket.studentId !== studentId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.queueTicket.update({
            where: { id: ticketId },
            data: { status: 'CANCELLED' }
        });

        res.status(200).json({ success: true, message: 'Left queue successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { joinQueue, leaveQueue };
