const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AttendanceRepository {
    async findActiveSessions(institutionId) {
        return await prisma.attendanceSession.findMany({
            where: {
                isActive: true,
                course: { institutionId }
            },
            include: { course: true },
            orderBy: { date: 'desc' }
        });
    }

    async findPastRecords(studentId) {
        return await prisma.attendanceRecord.findMany({
            where: { studentId },
            include: { 
                session: {
                    include: { course: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
    }

    async findSessionByCode(checkInCode) {
        return await prisma.attendanceSession.findUnique({
            where: { checkInCode },
            include: { course: true }
        });
    }

    async findRecordBySessionAndStudent(sessionId, studentId) {
        return await prisma.attendanceRecord.findUnique({
            where: {
                sessionId_studentId: {
                    sessionId,
                    studentId
                }
            }
        });
    }

    async createRecord(data) {
        return await prisma.attendanceRecord.create({ data });
    }
}

module.exports = new AttendanceRepository();