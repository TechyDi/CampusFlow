const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_for_local_dev';

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        if (!user.isApproved && user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Your account is pending Admin approval.' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000 // 12 hours
        });

        res.status(200).json({ success: true, message: 'Logged in successfully', role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

const logoutUser = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

const getSignupPage = async (req, res) => {
    try {
        const institutions = await prisma.institution.findMany({
            where: {
                name: {
                    notIn: ['CampusFlow HQ', 'CAMPUSFLOW HQ', 'Campusflow HQ']
                }
            },
            select: { id: true, name: true }
        });
        res.render('signup', { institutions });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const registerUser = async (req, res) => {
    const { name, email, password, institutionId } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                institutionId,
                role: 'STUDENT',
                isApproved: false // Admin must approve
            }
        });

        // Notify Admins
        const admins = await prisma.user.findMany({
            where: { institutionId, role: 'ADMIN' }
        });
        if (admins.length > 0) {
            const notifications = admins.map(admin => ({
                userId: admin.id,
                title: 'New Student Registration',
                message: `${name} (${email}) has registered and is waiting for approval.`,
                link: '/admin'
            }));
            await prisma.notification.createMany({ data: notifications });
        }

        res.status(201).json({ success: true, message: 'Registration successful! Please wait for Admin approval.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

module.exports = { loginUser, logoutUser, getSignupPage, registerUser };
