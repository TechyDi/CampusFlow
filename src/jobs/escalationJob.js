const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendEscalationEmail } = require('../services/emailService');

const prisma = new PrismaClient();

function startEscalationJob() {
    // Run at minute 0 past every hour (0 * * * *)
    cron.schedule('0 * * * *', async () => {
        console.log('Running Escalation Job check...');
        try {
            // Find complaints older than 48 hours that are still OPEN
            const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            
            const pendingComplaints = await prisma.complaint.findMany({
                where: {
                    status: 'OPEN',
                    createdAt: { lte: twoDaysAgo },
                    masterComplaintId: null // Only check master/independent tickets
                },
                include: { building: true, student: true, institution: true }
            });

            if (pendingComplaints.length === 0) {
                console.log('No tickets to escalate.');
                return;
            }

            for (const complaint of pendingComplaints) {
                // Find a Faculty/Warden for this institution
                const warden = await prisma.user.findFirst({
                    where: {
                        institutionId: complaint.institutionId,
                        role: 'FACULTY'
                    }
                });

                if (warden) {
                    const daysPending = Math.floor((Date.now() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                    await sendEscalationEmail(warden.email, warden.name, complaint.title, daysPending);
                }
            }

        } catch (error) {
            console.error('Escalation Job Error:', error);
        }
    });

    console.log('Escalation cron job scheduled (Runs hourly).');
}

module.exports = { startEscalationJob };
