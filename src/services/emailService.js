const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Use a verified domain or the default onboarding email for testing
const fromEmail = 'CampusFlow <onboarding@resend.dev>'; 

/**
 * Send an email to a student when their complaint is resolved.
 */
async function sendResolutionEmail(studentEmail, studentName, issueTitle) {
    try {
        const data = await resend.emails.send({
            from: fromEmail,
            to: studentEmail,
            subject: '✅ Ticket Resolved: ' + issueTitle,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Good news, ${studentName}!</h2>
                    <p>Your maintenance request for <strong>"${issueTitle}"</strong> has been marked as resolved by our staff.</p>
                    <p>If you are still experiencing issues, please log into your CampusFlow dashboard to submit a follow-up ticket.</p>
                    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">This is an automated message from CampusFlow.</p>
                </div>
            `
        });
        console.log('Resolution email sent:', data.id);
        return data;
    } catch (error) {
        console.error('Error sending resolution email:', error);
    }
}

/**
 * Send an escalation email to a Warden/Admin when a ticket is untouched.
 */
async function sendEscalationEmail(adminEmail, adminName, issueTitle, daysPending) {
    try {
        const data = await resend.emails.send({
            from: fromEmail,
            to: adminEmail,
            subject: `⚠️ ACTION REQUIRED: Escalated Ticket (${daysPending} Days Old)`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #f87171; border-radius: 8px; background-color: #fef2f2;">
                    <h2 style="color: #dc2626;">Ticket Escalation Alert</h2>
                    <p>Hello ${adminName},</p>
                    <p>This is an automated escalation. The following maintenance request has been pending for <strong>${daysPending} days</strong> without resolution:</p>
                    <blockquote style="border-left: 4px solid #ef4444; padding-left: 10px; font-weight: bold;">
                        "${issueTitle}"
                    </blockquote>
                    <p>Please log into your Warden/Admin dashboard immediately to assign or resolve this issue.</p>
                    <hr style="border: 0; border-top: 1px solid #f87171; margin: 20px 0;">
                    <p style="color: #991b1b; font-size: 12px;">This is an automated escalation from CampusFlow.</p>
                </div>
            `
        });
        console.log('Escalation email sent:', data.id);
        return data;
    } catch (error) {
        console.error('Error sending escalation email:', error);
    }
}

module.exports = {
    sendResolutionEmail,
    sendEscalationEmail
};
