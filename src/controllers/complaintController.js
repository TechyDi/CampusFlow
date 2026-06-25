const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { GoogleGenAI } = require('@google/genai');

// AI Initialization
let ai;
try {
    if (process.env.GEMINI_API_KEY) {
        ai = new GoogleGenAI({});
    }
} catch(e) {
    console.warn("Google GenAI init failed. Using fallback.");
}

async function categorizeWithAI(description) {
    if (!ai) {
        // Fallback keyword mock if no API key
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('water') || lowerDesc.includes('leak') || lowerDesc.includes('tap') || lowerDesc.includes('toilet') || lowerDesc.includes('bathroom') || lowerDesc.includes('sink')) return 'Plumbing';
        if (lowerDesc.includes('light') || lowerDesc.includes('fan') || lowerDesc.includes('ac') || lowerDesc.includes('switch') || lowerDesc.includes('wire')) return 'Electrical';
        if (lowerDesc.includes('wifi') || lowerDesc.includes('internet') || lowerDesc.includes('network') || lowerDesc.includes('router')) return 'IT';
        if (lowerDesc.includes('door') || lowerDesc.includes('bed') || lowerDesc.includes('wood') || lowerDesc.includes('table') || lowerDesc.includes('chair')) return 'Carpentry';
        return 'Electrical'; // Default fallback
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
        return 'Electrical'; // Default fallback if AI hallucinates
    } catch (e) {
        console.error("AI Error:", e);
        return 'Electrical';
    }
}

const createComplaint = async (req, res) => {
    const { title, building, description } = req.body;

    if (!title || !building || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const institutionId = req.user.institutionId;
        const studentId = req.user.id;
        
        const autoCategory = await categorizeWithAI(description);
        
        let catRecord = await prisma.category.findFirst({ where: { name: autoCategory, institutionId } });
        let bldRecord = await prisma.building.findFirst({ where: { name: building, institutionId } });

        if (!bldRecord) {
            bldRecord = await prisma.building.create({
                data: { institutionId, name: building, type: 'Hostel' }
            });
        }
        
        if (!catRecord) {
            catRecord = await prisma.category.findFirst({ where: { institutionId } });
        }

        const newComplaint = await prisma.complaint.create({
            data: {
                institutionId,
                studentId,
                categoryId: catRecord.id,
                buildingId: bldRecord.id,
                title,
                description,
                status: 'OPEN',
                aiTags: autoCategory
            },
            include: { category: true, building: true }
        });

        res.status(201).json({
            id: newComplaint.id.substring(0, 8),
            title: newComplaint.title,
            category: newComplaint.category.name,
            building: newComplaint.building.name,
            status: newComplaint.status,
            createdAt: newComplaint.createdAt,
            aiCategorized: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const studentId = req.user.id;

        const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
        
        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
        if (complaint.studentId !== studentId) return res.status(403).json({ error: 'Unauthorized' });
        if (complaint.status !== 'OPEN') return res.status(400).json({ error: 'Only OPEN complaints can be withdrawn' });

        await prisma.complaint.delete({ where: { id: complaintId } });
        res.status(200).json({ success: true, message: 'Complaint withdrawn successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createComplaint, deleteComplaint };
