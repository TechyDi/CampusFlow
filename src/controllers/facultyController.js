const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const getFacultyDashboard = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const institutionId = req.user.institutionId;

        const courses = await prisma.course.findMany({
            where: { facultyId, institutionId },
            include: {
                sessions: {
                    orderBy: { date: 'desc' },
                    include: {
                        _count: { select: { records: true } }
                    }
                }
            }
        });

        res.render('faculty', { courses, title: 'Faculty Portal' });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
};

const createCourse = async (req, res) => {
    try {
        const { code, name } = req.body;
        const facultyId = req.user.id;
        const institutionId = req.user.institutionId;

        if (!code || !name) return res.status(400).json({ error: 'Code and name required' });

        const course = await prisma.course.create({
            data: { code, name, facultyId, institutionId }
        });
        res.json({ success: true, course });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create course' });
    }
};

const startSession = async (req, res) => {
    try {
        const { courseId, latitude, longitude, durationMinutes } = req.body;
        const facultyId = req.user.id;

        // Verify course belongs to this faculty
        const course = await prisma.course.findFirst({
            where: { id: courseId, facultyId }
        });

        if (!course) return res.status(403).json({ error: 'Unauthorized course' });

        // Generate 5-char code
        const checkInCode = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 5);

        // Calculate expiration if duration is provided
        let expiresAt = null;
        if (durationMinutes) {
            expiresAt = new Date(Date.now() + parseInt(durationMinutes) * 60000);
        }

        const session = await prisma.attendanceSession.create({
            data: {
                courseId,
                checkInCode,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                radiusMeters: 50.0,
                expiresAt
            }
        });
        res.json({ success: true, session });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to start session' });
    }
};

const stopSession = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.user.id;

        const session = await prisma.attendanceSession.findUnique({
            where: { id },
            include: { course: true }
        });

        if (!session || session.course.facultyId !== facultyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.attendanceSession.update({
            where: { id },
            data: { isActive: false }
        });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to stop session' });
    }
};

const getAttendanceSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const facultyId = req.user.id;

        const session = await prisma.attendanceSession.findUnique({
            where: { id },
            include: { 
                course: true,
                records: {
                    include: { student: true },
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!session || session.course.facultyId !== facultyId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        res.json({ success: true, session });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to get records' });
    }
};

module.exports = {
    getFacultyDashboard,
    createCourse,
    startSession,
    stopSession,
    getAttendanceSheet
};
