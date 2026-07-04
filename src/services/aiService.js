const { GoogleGenAI } = require('@google/genai');

const geminiApiKey = process.env.GEMINI_API_KEY || 'dummy_key';
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

/**
 * Checks if a new complaint is a duplicate of any existing recent complaints.
 * @param {Object} newComplaint - { title, description }
 * @param {Array} recentComplaints - Array of { id, title, description }
 * @returns {Promise<string|null>} - Returns the ID of the master complaint if duplicate, otherwise null.
 */
async function detectDuplicateComplaint(newComplaint, recentComplaints) {
    if (!recentComplaints || recentComplaints.length === 0) return null;

    try {
        const prompt = `
You are an intelligent duplicate detection system for a campus maintenance platform.
A student has just submitted a new maintenance complaint. 
Below is a list of recent active complaints in the SAME building.

Recent Complaints:
${recentComplaints.map(c => `ID: ${c.id} | Title: ${c.title} | Desc: ${c.description}`).join('\n')}

New Complaint:
Title: ${newComplaint.title}
Desc: ${newComplaint.description}

Does the New Complaint describe the EXACT SAME physical issue as any of the Recent Complaints?
(For example: "No water in block B" and "Water is not coming in bathroom" in the same building are duplicates).

If YES, output ONLY the ID of the duplicate Recent Complaint. 
If NO, output "NO".
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1, // Keep it deterministic
            }
        });

        const result = (response.text || '').trim();
        
        if (result === 'NO' || !result) {
            return null;
        }

        // Validate the result is an actual ID from our list
        const matchedComplaint = recentComplaints.find(c => c.id === result);
        return matchedComplaint ? matchedComplaint.id : null;

    } catch (error) {
        console.error('AI Duplicate Detection Error:', error);
        return null; // Fail gracefully
    }
}

module.exports = { detectDuplicateComplaint };
