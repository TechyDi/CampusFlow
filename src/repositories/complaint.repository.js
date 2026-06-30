const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ComplaintRepository {
    async findCategoryByName(name, institutionId) {
        return await prisma.category.findFirst({ where: { name, institutionId } });
    }
    
    async findFirstCategory(institutionId) {
        return await prisma.category.findFirst({ where: { institutionId } });
    }

    async findBuildingById(id) {
        return await prisma.building.findUnique({ where: { id } });
    }

    async findRecentMasterComplaints(buildingId) {
        return await prisma.complaint.findMany({
            where: {
                buildingId,
                status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
                masterComplaintId: null
            },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
    }

    async createComplaint(data) {
        return await prisma.complaint.create({
            data,
            include: { category: true, building: true }
        });
    }

    async findComplaintById(id) {
        return await prisma.complaint.findUnique({ where: { id } });
    }

    async findComplaintByIdAndStaff(id, staffId) {
        return await prisma.complaint.findFirst({
            where: { id, assignedStaffId: staffId }
        });
    }

    async deleteComplaint(id) {
        return await prisma.complaint.delete({ where: { id } });
    }

    async updateComplaint(id, data) {
        return await prisma.complaint.update({
            where: { id },
            data,
            include: { student: true, subComplaints: { include: { student: true } } }
        });
    }

    async findStudentComplaints(institutionId, studentId) {
        return await prisma.complaint.findMany({
            where: { institutionId, studentId },
            include: { category: true, building: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findAllCategories(institutionId) {
        return await prisma.category.findMany({ where: { institutionId } });
    }

    async findAllBuildings(institutionId) {
        return await prisma.building.findMany({ where: { institutionId } });
    }

    async createNotification(data) {
        return await prisma.notification.create({ data });
    }
}

module.exports = new ComplaintRepository();