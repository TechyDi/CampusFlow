const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_for_local_dev';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        res.locals.user = user; 
        
        try {
            const institution = await prisma.institution.findUnique({
                where: { id: user.institutionId },
                select: { subscriptionPlan: true }
            });
            res.locals.subscriptionPlan = institution ? institution.subscriptionPlan : 'FREE';

            const unreadCount = await prisma.notification.count({
                where: { userId: user.id, isRead: false }
            });
            const notifications = await prisma.notification.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                take: 25
            });
            res.locals.unreadCount = unreadCount;
            res.locals.globalNotifications = notifications;
        } catch (e) {
            res.locals.unreadCount = 0;
            res.locals.globalNotifications = [];
        }
        
        next();
    });
}

function checkUserContext(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        res.locals.user = null;
        return next();
    }
    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (!err) {
            req.user = user;
            res.locals.user = user;
            try {
                const institution = await prisma.institution.findUnique({
                    where: { id: user.institutionId },
                    select: { subscriptionPlan: true }
                });
                res.locals.subscriptionPlan = institution ? institution.subscriptionPlan : 'FREE';

                const unreadCount = await prisma.notification.count({
                    where: { userId: user.id, isRead: false }
                });
                const notifications = await prisma.notification.findMany({
                    where: { userId: user.id },
                    orderBy: { createdAt: 'desc' },
                    take: 25
                });
                res.locals.unreadCount = unreadCount;
                res.locals.globalNotifications = notifications;
            } catch (e) {
                res.locals.unreadCount = 0;
                res.locals.globalNotifications = [];
            }
        } else {
            res.locals.user = null;
        }
        next();
    });
}

function checkRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return res.redirect('/login');
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).send('Forbidden: You do not have access to this resource');
        }
        next();
    };
}

function checkSubscription(requiredPlan) {
    return (req, res, next) => {
        const currentPlan = res.locals.subscriptionPlan || 'FREE';
        const plans = ['FREE', 'PRO', 'ENTERPRISE'];
        
        if (plans.indexOf(currentPlan) < plans.indexOf(requiredPlan)) {
            if (req.method === 'GET') {
                return res.redirect('/upgrade-required');
            } else {
                return res.status(403).json({ error: 'Upgrade required for this feature' });
            }
        }
        next();
    };
}

module.exports = { authenticateToken, checkUserContext, checkRole, checkSubscription };
