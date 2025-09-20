// server.js
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

// Utility function to validate emails
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Utility function to generate HTML table
const generateStudentTable = (students) => {
  if (!students || students.length === 0) return '<p>No at-risk students found.</p>';

  const tableRows = students.map(student => `
    <tr style="border-bottom:1px solid #ddd;">
      <td>${student.student_id}</td>
      <td>${student.attendance_pct}%</td>
      <td>${student.avg_score}</td>
      <td>${student.score_trend >= 0 ? '+' : ''}${student.score_trend}</td>
      <td>$${student.fee_pending}</td>
      <td>
        <span style="
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          ${student.risk_level === 'High Risk' ? 'background-color:#fee2e2;color:#dc2626;' : 'background-color:#fef3c7;color:#d97706;'}
        ">
          ${student.risk_level}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color:#1f2937;">At-Risk Students Alert</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Attendance %</th>
            <th>Avg Score</th>
            <th>Score Trend</th>
            <th>Fee Pending</th>
            <th>Risk Level</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS) });
});

// Send alert emails
app.post('/send-alerts', async (req, res) => {
  try {
    const { recipients, subject, students } = req.body;

    if (!recipients?.length) return res.status(400).json({ success: false, error: 'Recipients required' });
    if (!students?.length) return res.status(400).json({ success: false, error: 'Students required' });

    const invalidEmails = recipients.filter(email => !validateEmail(email.trim()));
    if (invalidEmails.length) return res.status(400).json({ success: false, error: `Invalid emails: ${invalidEmails.join(', ')}` });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ success: false, error: 'EMAIL_USER and EMAIL_PASS not set in .env' });
    }

    const transporter = createTransporter();
    await transporter.verify();

    const htmlContent = generateStudentTable(students);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: subject || 'At-Risk Students Alert',
      html: htmlContent
    });

    res.json({ success: true, messageId: info.messageId });

  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
});
