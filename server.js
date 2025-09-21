import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Use dotenv to load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Ensure environment variables are set for email
const EMAIL_USERNAME = process.env.EMAIL_USERNAME;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Utility functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const createTransporter = () => {
  if (!EMAIL_USERNAME || !EMAIL_PASSWORD) {
    throw new Error('Email credentials are not set in environment variables.');
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

const generateStudentEmailHTML = (students) => {
  // ... (HTML generation function remains the same)
  if (!students || students.length === 0) {
    return '<p>No at-risk students found.</p>';
  }

  const highRiskStudents = students.filter(s => s.risk_level === 'High Risk');
  const atRiskStudents = students.filter(s => s.risk_level === 'At Risk');

  const generateTableRows = (studentList, riskColor) => {
    return studentList.map(student => `
      <tr style="background-color: ${riskColor};">
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${student.student_id}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${student.attendance_pct}%</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${student.avg_score}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${student.score_trend >= 0 ? '+' : ''}${student.score_trend}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">$${student.fee_pending}</td>
        <td style="padding: 12px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${student.risk_level}</td>
      </tr>
    `).join('');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>At-Risk Students Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px;">🚨 At-Risk Students Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Student Counseling Dashboard Report</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #495057; margin-top: 0;">📊 Summary</h2>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <h3 style="color: #dc3545; margin: 0;">${highRiskStudents.length}</h3>
            <p style="margin: 5px 0; color: #6c757d;">High Risk Students</p>
          </div>
          <div>
            <h3 style="color: #ffc107; margin: 0;">${atRiskStudents.length}</h3>
            <p style="margin: 5px 0; color: #6c757d;">At Risk Students</p>
          </div>
          <div>
            <h3 style="color: #17a2b8; margin: 0;">${students.length}</h3>
            <p style="margin: 5px 0; color: #6c757d;">Total Requiring Attention</p>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #495057;">📋 Student Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #343a40; color: white;">
              <th style="padding: 15px; border: 1px solid #ddd; text-align: center;">Student ID</th>
              <th style="padding: 15px; border: 1px solid #ddd; text-align: center;">Attendance %</th>
              <th style="padding: 15px; border: 1px solid #ddd; text-align: center;">Avg Score</th>
              <th style="padding: 15px; border: 1px solid #ddd; text-align: center;">Score Trend</th>
              <th style="padding: 15px; border: 1px solid #ddd; text-align: center;">Fee Pending</th>
              <th style="padding: 15px; border: 1px solid #ddd; text-align: center;">Risk Level</th>
            </tr>
          </thead>
          <tbody>
            ${generateTableRows(highRiskStudents, '#ffebee')}
            ${generateTableRows(atRiskStudents, '#fff8e1')}
          </tbody>
        </table>
      </div>

      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 5px solid #2196f3; margin-bottom: 25px;">
        <h3 style="color: #1976d2; margin-top: 0;">💡 Recommended Actions</h3>
        <ul style="color: #424242; margin: 0; padding-left: 20px;">
          <li><strong>High Risk Students:</strong> Immediate intervention required - Schedule one-on-one counseling sessions</li>
          <li><strong>At Risk Students:</strong> Monitor closely and provide additional academic support</li>
          <li><strong>Fee Issues:</strong> Contact students with pending fees to discuss payment plans</li>
          <li><strong>Attendance:</strong> Implement attendance improvement strategies for students below 75%</li>
          <li><strong>Academic Performance:</strong> Arrange tutoring for students with declining scores</li>
        </ul>
      </div>

      <div style="background-color: #f1f3f4; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #5f6368; font-size: 14px;">
          📧 This automated report was generated by the AI-based Drop-out Prediction & Counseling Dashboard
        </p>
        <p style="margin: 5px 0 0 0; color: #5f6368; font-size: 12px;">
          For technical support or questions, please contact the IT department.
        </p>
      </div>
    </body>
    </html>
  `;
};

// API Routes
app.get('/', (req, res) => {
  res.json({ message: 'AI Drop-out Prediction Dashboard API', status: 'Running' });
});

// Send alerts endpoint - now requires no credentials from the frontend
app.post('/send-alerts', async (req, res) => {
  try {
    const { recipients, subject, students } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'Recipients array is required and must not be empty' });
    }

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ success: false, error: 'Students array is required' });
    }

    const invalidEmails = recipients.filter(email => !validateEmail(email.trim()));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ success: false, error: `Invalid recipient email addresses: ${invalidEmails.join(', ')}` });
    }

    const transporter = createTransporter();
    await transporter.verify();

    const htmlContent = generateStudentEmailHTML(students);

    const info = await transporter.sendMail({
      from: `"Student Analytics Dashboard" <${EMAIL_USERNAME}>`,
      to: recipients.join(', '),
      subject: subject || 'At-Risk Students Alert',
      html: htmlContent,
      text: `At-Risk Students Alert: ${students.length} student(s) require immediate attention.`
    });

    console.log('Email sent successfully:', info.messageId);
    res.json({ success: true, messageId: info.messageId, studentsCount: students.length, recipientsCount: recipients.length });

  } catch (error) {
    console.error('Email sending failed:', error);
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check backend environment variables for EMAIL_USERNAME and EMAIL_PASSWORD.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({ success: false, error: errorMessage });
  }
});

// A new, safer way to test configuration
app.get('/test-email-config', async (req, res) => {
  try {
    if (!EMAIL_USERNAME || !EMAIL_PASSWORD) {
      return res.status(500).json({ success: false, error: 'Email credentials not set on server.' });
    }
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ success: true, message: 'Email configuration is valid!' });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ success: false, error: 'Email configuration test failed. Check server logs.' });
  }
});

// Serve the SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});