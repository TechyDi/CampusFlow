const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

const registerInstitution = async (req, res) => {
    try {
        const { institutionName, plan, buildings, users } = req.body;
        
        if (!institutionName || !plan || !users) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        
        let buildingList = [];
        try {
            buildingList = JSON.parse(buildings);
        } catch (e) {
            buildingList = [];
        }
        
        let userList = [];
        try {
            userList = JSON.parse(users);
        } catch(e) {
            userList = [];
        }

        if (plan === 'FREE' && buildingList.length > 2) {
            return res.status(400).json({ error: 'Free plan supports a maximum of 2 buildings.' });
        }
        if (plan === 'PRO' && buildingList.length > 10) {
            return res.status(400).json({ error: 'Pro plan supports a maximum of 10 buildings.' });
        }
        
        const subdomain = institutionName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Use a transaction to create institution, buildings, and admin user
        const result = await prisma.$transaction(async (tx) => {
            const institution = await tx.institution.create({
                data: {
                    name: institutionName,
                    subdomain: subdomain,
                    subscriptionPlan: plan,
                    buildings: {
                        create: buildingList.map(b => ({ name: b.name, type: b.type }))
                    }
                }
            });
            
            for (const user of userList) {
                const passwordHash = await bcrypt.hash(user.password, 10);
                await tx.user.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        passwordHash,
                        role: user.role,
                        institutionId: institution.id,
                        isApproved: true
                    }
                });
            }
            
            return { institution };
        });
        
        res.status(200).json({ success: true, message: 'Institution successfully registered. You may now log in.' });
    } catch (error) {
        console.error("Error registering institution:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'An account with this email already exists. Please use a different email address.' });
        }
        res.status(500).json({ error: 'Server error during registration.' });
    }
};

module.exports = { registerInstitution };
