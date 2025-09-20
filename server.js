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
app.use(cors({ origin: '*' })); // allow frontend requests from any origin
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure Nodemailer transporter
const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

// Utility functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateStudentTable = (students) => {
  if (!students || students.length === 0) return '<p>No at-risk students found.</p>';

  const rows = students
    .map(
      (s) => `
        <tr style="border-bottom:1px solid #ddd;">
          <td>${s.student_id}</td>
          <td>${s.attendance_pct}%</td>
          <td>${s.avg_score}</td>
          <td>${s.score_trend >= 0 ? '+' : ''}${s.score_trend}</td>
          <td>$${s.fee_pending}</td>
          <td>${s.risk_level}</td>
        </tr>`
    )
    .join('');

  return `
    <table border="1" style="border-collapse:collapse; width:100%">
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
      <tbody>${rows}</tbody>
    </table>`;
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
    timestamp: new Date().toISOString(),
  });
});

// Test email configuration
app.post('/test-email', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ success: false, error: 'Email credentials not configured' });
    }

    const transporter = createTransporter();
    await transporter.verify();

    res.json({ success: true, message: 'Email configuration is valid' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send alerts
app.post('/send-alerts', async (req, res) => {
  try {
    const { recipients, subject, students } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'Recipients array is required' });
    }
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ success: false, error: 'Students array is required' });
    }

    const invalidEmails = recipients.filter((email) => !validateEmail(email.trim()));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ success: false, error: `Invalid emails: ${invalidEmails.join(', ')}` });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ success: false, error: 'Email credentials not configured in .env' });
    }

    const transporter = createTransporter();
    await transporter.verify();

    const htmlContent = generateStudentTable(students);

    const info = await transporter.sendMail({
      from: `"Student Analytics Dashboard" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: subject || 'At-Risk Students Alert',
      html: htmlContent,
      text: `At-Risk Students Alert: ${students.length} student(s) require attention.`,
    });

    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId, studentsCount: students.length });
  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
