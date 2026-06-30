const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthRepository = require('../repositories/auth.repository');
const AppError = require('../utils/AppError');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_for_local_dev';

class AuthService {
    async loginUser(email, password) {
        const user = await AuthRepository.findUserByEmail(email);
        if (!user) {
            throw new AppError(401, 'Invalid credentials');
        }
        
        if (!user.isApproved && user.role !== 'SUPER_ADMIN') {
            throw new AppError(403, 'Your account is pending Admin approval.');
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            throw new AppError(401, 'Invalid credentials');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, institutionId: user.institutionId },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        logger.info(`User logged in`, { category: logger.categories.AUTH, user: user.id });

        return { token, role: user.role };
    }

    async getSignupData() {
        return await AuthRepository.findInstitutionsForSignup();
    }

    async registerUser(name, email, password, institutionId) {
        const existing = await AuthRepository.findUserByEmail(email);
        if (existing) {
            throw new AppError(400, 'Email already registered');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await AuthRepository.createUser({
            name,
            email,
            passwordHash,
            institutionId,
            role: 'STUDENT',
            isApproved: false // Admin must approve
        });

        logger.info(`New user registered`, { category: logger.categories.AUTH, user: user.id });

        // Notify Admins
        const admins = await AuthRepository.findAdminsForInstitution(institutionId);
        if (admins.length > 0) {
            const notifications = admins.map(admin => ({
                userId: admin.id,
                title: 'New Student Registration',
                message: `${name} (${email}) has registered and is waiting for approval.`,
                link: '/admin'
            }));
            await AuthRepository.createNotifications(notifications);
        }

        return user;
    }
}

module.exports = new AuthService();
