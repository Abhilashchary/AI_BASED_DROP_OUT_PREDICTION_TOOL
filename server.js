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
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Utility functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateStudentTable = (students) => {
  if (!students || students.length === 0) return '<p>No at-risk students found.</p>';

  const tableRows = students.map(student => `
    <tr style="border-bottom:1px solid #ddd;">
      <td>${student.student_id}</td>
      <td>${student.attendance_pct}%</td>
      <td>${student.avg_score}</td>
      <td>${student.score_trend >=0 ? '+' : ''}${student.score_trend}</td>
      <td>${student.fee_pending}</td>
      <td>${student.risk_level}</td>
    </tr>
  `).join('');

  return `<table border="1" style="border-collapse:collapse; width:100%;">${tableRows}</table>`;
};

// Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS) });
});

app.post('/send-alerts', async (req, res) => {
  try {
    const { recipients, subject, students } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ success: false, error: 'Recipients array is required' });

    if (!students || !Array.isArray(students))
      return res.status(400).json({ success: false, error: 'Students array is required' });

    const invalidEmails = recipients.filter(email => !validateEmail(email.trim()));
    if (invalidEmails.length > 0)
      return res.status(400).json({ success: false, error: `Invalid emails: ${invalidEmails.join(', ')}` });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)
      return res.status(500).json({ success: false, error: 'Email credentials not configured in .env' });

    const transporter = createTransporter();
    await transporter.verify();

    const htmlContent = generateStudentTable(students);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: subject || 'At-Risk Students Alert',
      html: htmlContent
    });

    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });

  } catch (err) {
    console.error('Email sending failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT
