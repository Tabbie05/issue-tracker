const nodemailer = require('nodemailer');

// Create reusable transporter
function createTransporter() {
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;

  if (!email || !password) {
    console.log('Email notifications disabled: SMTP_EMAIL or SMTP_PASSWORD not set');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password,
    },
  });
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

// Send assignment notification email to the assignee's email from the issue
async function sendAssignmentEmail(issue, type = 'assigned') {
  const transport = getTransporter();
  if (!transport) return { success: false, reason: 'SMTP not configured' };

  const recipientEmail = issue.assigneeEmail;

  if (!recipientEmail) {
    console.log(`No email provided for assignee: ${issue.assignee}`);
    return { success: false, reason: 'No email provided for assignee' };
  }

  const subject = type === 'assigned'
    ? `New Issue Assigned: ${issue.title}`
    : `Issue Reassigned: ${issue.title}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Issue Tracker</h1>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1f2937; margin: 0 0 8px;">${issue.title}</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
          ${type === 'assigned'
            ? `Hi <b>${issue.assignee}</b>, a new issue has been assigned to you.`
            : `Hi <b>${issue.assignee}</b>, an issue has been reassigned to you.`}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 120px;">Project</td>
            <td style="padding: 10px 16px; border: 1px solid #e5e7eb; color: #4b5563;">${issue.project}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Priority</td>
            <td style="padding: 10px 16px; border: 1px solid #e5e7eb;">
              <span style="background: ${getPriorityColor(issue.priority)}; color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${issue.priority}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Status</td>
            <td style="padding: 10px 16px; border: 1px solid #e5e7eb; color: #4b5563;">${issue.status}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151;">Assignee</td>
            <td style="padding: 10px 16px; border: 1px solid #e5e7eb; color: #4b5563;">${issue.assignee}</td>
          </tr>
        </table>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="font-weight: 600; color: #374151; margin: 0 0 6px; font-size: 13px;">Description</p>
          <p style="color: #4b5563; margin: 0; font-size: 14px; line-height: 1.5;">${issue.description}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
          This is an automated notification from Issue Tracker.
        </p>
      </div>
    </div>
  `;

  try {
    await transport.sendMail({
      from: `"Issue Tracker" <${process.env.SMTP_EMAIL}>`,
      to: recipientEmail,
      subject,
      html,
    });
    console.log(`Email sent to ${issue.assignee} (${recipientEmail})`);
    return { success: true };
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { success: false, reason: err.message };
  }
}

function getPriorityColor(priority) {
  const colors = {
    Low: '#22c55e',
    Medium: '#f59e0b',
    High: '#f97316',
    Critical: '#ef4444',
  };
  return colors[priority] || '#6b7280';
}

module.exports = { sendAssignmentEmail };
