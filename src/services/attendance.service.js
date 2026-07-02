const AttendanceRepository = require('../repositories/attendance.repository');
const AppError = require('../utils/AppError');
const logger = require('../logger');

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; 
    
    const R = 6371e3; 
    const rad = Math.PI / 180;
    const phi1 = lat1 * rad;
    const phi2 = lat2 * rad;
    const deltaPhi = (lat2 - lat1) * rad;
    const deltaLambda = (lon2 - lon1) * rad;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}

class AttendanceService {
    async getAttendancePageData(institutionId, studentId) {
        let activeSessions = await AttendanceRepository.findActiveSessions(institutionId);
        
        activeSessions = activeSessions.filter(s => {
            if (!s.expiresAt) return true;
            return new Date() <= s.expiresAt;
        });

        const pastRecords = await AttendanceRepository.findPastRecords(studentId);

        return { activeSessions, pastRecords };
    }

    async checkIn(studentId, institutionId, checkInCode, lat, lng) {
        const session = await AttendanceRepository.findSessionByCode(checkInCode);

        if (!session || !session.isActive) {
            throw new AppError(404, 'Invalid or inactive check-in code.');
        }

        if (session.expiresAt && new Date() > session.expiresAt) {
            throw new AppError(403, 'This attendance session has expired.');
        }

        if (session.course.institutionId !== institutionId) {
            throw new AppError(403, 'This course does not belong to your institution.');
        }

        if (session.latitude && session.longitude) {
            if (!lat || !lng) {
                throw new AppError(400, 'Location required for this session.');
            }

            const distance = calculateDistance(
                parseFloat(session.latitude), 
                parseFloat(session.longitude), 
                parseFloat(lat), 
                parseFloat(lng)
            );

            if (distance > (session.radiusMeters + 15)) {
                throw new AppError(403, `You are too far from the classroom (${Math.round(distance)}m away). Must be within ${session.radiusMeters}m.`);
            }
        }

        const existingRecord = await AttendanceRepository.findRecordBySessionAndStudent(session.id, studentId);
        if (existingRecord) {
            throw new AppError(400, 'You have already checked into this session.');
        }

        await AttendanceRepository.createRecord({
            sessionId: session.id,
            studentId,
            latitude: lat ? parseFloat(lat) : null,
            longitude: lng ? parseFloat(lng) : null
        });

        logger.info(`Student checked into session ${session.id}`, { category: logger.categories.HTTP, user: studentId });

        return session.course.name;
    }
}

module.exports = new AttendanceService();