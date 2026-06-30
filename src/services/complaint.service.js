const ComplaintRepository = require('../repositories/complaint.repository');
const AppError = require('../utils/AppError');
const logger = require('../logger');
const { GoogleGenAI } = require('@google/genai');
const { detectDuplicateComplaint } = require('./aiService');
const { sendResolutionEmail } = require('./emailService');

let ai;
try {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({});
    }
} catch(e) {
    logger.warn("Google GenAI init failed. Using fallback.", { category: logger.categories.ERROR });
}

async function categorizeWithAI(description) {
    if (!ai) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('water') || lowerDesc.includes('leak') || lowerDesc.includes('tap') || lowerDesc.includes('toilet') || lowerDesc.includes('bathroom') || lowerDesc.includes('sink')) return 'Plumbing';
        if (lowerDesc.includes('light') || lowerDesc.includes('fan') || lowerDesc.includes('ac') || lowerDesc.includes('switch') || lowerDesc.includes('wire')) return 'Electrical';
        if (lowerDesc.includes('wifi') || lowerDesc.includes('internet') || lowerDesc.includes('network') || lowerDesc.includes('router')) return 'IT';
        if (lowerDesc.includes('door') || lowerDesc.includes('bed') || lowerDesc.includes('wood') || lowerDesc.includes('table') || lowerDesc.includes('chair')) return 'Carpentry';
        return 'Electrical'; 
    }
    try {
        const prompt = `You are an AI assistant for a campus maintenance system. 
        Read the following complaint description and categorize it into exactly one of these strictly predefined categories: 
        "Electrical", "Plumbing", "IT", "Carpentry". 
        Do not output any other words. Just the exact category name.
        Description: "${description}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const predicted = response.text.trim();
        const valid = ['Electrical', 'Plumbing', 'IT', 'Carpentry'];
        if (valid.includes(predicted)) return predicted;
        return 'Electrical'; 
    } catch (e) {
        logger.error("AI Error: " + e.message, { category: logger.categories.ERROR });
        return 'Electrical';
    }
}

class ComplaintService {
    async createComplaint(institutionId, studentId, title, buildingId, room, description) {
        const autoCategory = await categorizeWithAI(description);
        
        let catRecord = await ComplaintRepository.findCategoryByName(autoCategory, institutionId);
        let bldRecord = await ComplaintRepository.findBuildingById(buildingId);

        if (!bldRecord) {
            throw new AppError(400, 'Selected building does not exist');
        }
        if (!catRecord) {
            catRecord = await ComplaintRepository.findFirstCategory(institutionId);
        }

        const recentComplaints = await ComplaintRepository.findRecentMasterComplaints(bldRecord.id);
        const duplicateId = await detectDuplicateComplaint({ title, description }, recentComplaints);

        const newComplaint = await ComplaintRepository.createComplaint({
            institutionId,
            studentId,
            categoryId: catRecord.id,
            buildingId: bldRecord.id,
            roomNumber: room || null,
            title,
            description,
            status: 'OPEN',
            aiTags: autoCategory,
            masterComplaintId: duplicateId || null
        });

        logger.info(`Complaint created`, { category: logger.categories.HTTP, id: newComplaint.id });
        return newComplaint;
    }

    async deleteComplaint(complaintId, studentId) {
        const complaint = await ComplaintRepository.findComplaintById(complaintId);
        if (!complaint) throw new AppError(404, 'Complaint not found');
        if (complaint.studentId !== studentId) throw new AppError(403, 'Unauthorized');
        if (complaint.status !== 'OPEN') throw new AppError(400, 'Only OPEN complaints can be withdrawn');

        await ComplaintRepository.deleteComplaint(complaintId);
        logger.info(`Complaint withdrawn`, { category: logger.categories.HTTP, id: complaintId });
    }

    async assignComplaint(complaintId, staffId) {
        const complaint = await ComplaintRepository.updateComplaint(complaintId, { 
            assignedStaffId: staffId,
            status: 'ASSIGNED'
        });

        await ComplaintRepository.createNotification({
            userId: complaint.studentId,
            title: 'Complaint Assigned',
            message: `Your complaint "${complaint.title}" has been assigned to a staff member.`,
            link: '/complaints'
        });

        await ComplaintRepository.createNotification({
            userId: staffId,
            title: 'New Task Assigned',
            message: `You have been assigned to resolve: "${complaint.title}".`,
            link: '/staff'
        });
        
        logger.info(`Complaint assigned to staff`, { category: logger.categories.JOB, id: complaintId });
    }

    async addRemark(complaintId, remark) {
        await ComplaintRepository.updateComplaint(complaintId, { wardenRemark: remark });
    }

    async updateStatus(complaintId, status, staffId, userRole) {
        let task;
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'WARDEN') {
            task = await ComplaintRepository.findComplaintById(complaintId);
        } else {
            task = await ComplaintRepository.findComplaintByIdAndStaff(complaintId, staffId);
        }

        if (!task) throw new AppError(403, 'Not authorized for this task');

        const updated = await ComplaintRepository.updateComplaint(complaintId, { status });

        if (status === 'RESOLVED') {
            await sendResolutionEmail(updated.student.email, updated.student.name, updated.title);
            for (const sub of updated.subComplaints) {
                await sendResolutionEmail(sub.student.email, sub.student.name, sub.title);
                await ComplaintRepository.createNotification({
                    userId: sub.student.id,
                    title: 'Complaint Resolved',
                    message: `Your similar complaint "${sub.title}" has been resolved.`,
                    link: '/complaints'
                });
                await ComplaintRepository.updateComplaint(sub.id, { status: 'RESOLVED' });
            }
        }

        await ComplaintRepository.createNotification({
            userId: updated.studentId,
            title: `Complaint Status: ${status}`,
            message: `Your complaint "${updated.title}" is now ${status}.`,
            link: '/complaints'
        });
        
        logger.info(`Complaint status updated to ${status}`, { category: logger.categories.JOB, id: complaintId });
    }

    async getStudentComplaintsData(institutionId, studentId) {
        const categories = await ComplaintRepository.findAllCategories(institutionId);
        const buildings = await ComplaintRepository.findAllBuildings(institutionId);
        const complaints = await ComplaintRepository.findStudentComplaints(institutionId, studentId);
        
        const mappedComplaints = complaints.map(c => ({
            id: c.id.substring(0, 8),
            fullId: c.id,
            title: c.title,
            category: c.category.name,
            building: c.building.name,
            roomNumber: c.roomNumber,
            status: c.status,
            createdAt: c.createdAt
        }));

        return { categories, buildings, complaints: mappedComplaints };
    }
}

module.exports = new ComplaintService();