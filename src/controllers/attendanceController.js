const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Haversine formula to calculate distance in meters between two lat/lng coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // Return infinite distance if missing data
    
    const R = 6371e3; // Earth's radius in meters
    const rad = Math.PI / 180;
    const phi1 = lat1 * rad;
    const phi2 = lat2 * rad;
    const deltaPhi = (lat2 - lat1) * rad;
    const deltaLambda = (lon2 - lon1) * rad;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

const getAttendancePage = async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        
        // Find all active sessions for courses in the student's institution
        let activeSessions = await prisma.attendanceSession.findMany({
            where: {
                isActive: true,
                course: { institutionId }
            },
            include: { course: true },
            orderBy: { date: 'desc' }
        });

        // Filter out expired ones
        activeSessions = activeSessions.filter(s => {
            if (!s.expiresAt) return true;
            return new Date() <= s.expiresAt;
        });

        // Get past attendance for this student
        const pastRecords = await prisma.attendanceRecord.findMany({
            where: { studentId: req.user.id },
            include: { 
                session: {
                    include: { course: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });

        res.render('attendance', {
            title: 'Smart Attendance',
            activeSessions,
            pastRecords,
            studentId: req.user.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

const checkIn = async (req, res) => {
    try {
        const { checkInCode, lat, lng } = req.body;
        const studentId = req.user.id;

        if (!checkInCode) {
            return res.status(400).json({ error: 'Check-in code is required.' });
        }

        // Find the active session by code
        const session = await prisma.attendanceSession.findUnique({
            where: { checkInCode },
            include: { course: true }
        });

        if (!session || !session.isActive) {
            return res.status(404).json({ error: 'Invalid or inactive check-in code.' });
        }

        if (session.expiresAt && new Date() > session.expiresAt) {
            return res.status(403).json({ error: 'This attendance session has expired.' });
        }

        // Check if student belongs to same institution
        if (session.course.institutionId !== req.user.institutionId) {
            return res.status(403).json({ error: 'This course does not belong to your institution.' });
        }

        // Validate Geolocation if session has it enabled
        if (session.latitude && session.longitude) {
            if (!lat || !lng) {
                return res.status(400).json({ error: 'Location required for this session.' });
            }

            const distance = calculateDistance(
                parseFloat(session.latitude), 
                parseFloat(session.longitude), 
                parseFloat(lat), 
                parseFloat(lng)
            );

            // Give a generous 15-meter GPS drift buffer on top of radius
            if (distance > (session.radiusMeters + 15)) {
                return res.status(403).json({ 
                    error: `You are too far from the classroom (${Math.round(distance)}m away). Must be within ${session.radiusMeters}m.` 
                });
            }
        }

        // Check if already checked in
        const existingRecord = await prisma.attendanceRecord.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId: session.id,
                    studentId
                }
            }
        });

        if (existingRecord) {
            return res.status(400).json({ error: 'You have already checked into this session.' });
        }

        // Record attendance
        await prisma.attendanceRecord.create({
            data: {
                sessionId: session.id,
                studentId,
                latitude: lat ? parseFloat(lat) : null,
                longitude: lng ? parseFloat(lng) : null
            }
        });

        res.status(200).json({ success: true, message: `Checked into ${session.course.name} successfully!` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getAttendancePage, checkIn };
