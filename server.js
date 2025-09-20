const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure Nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
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

// Utility function to validate email addresses
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function to generate HTML table for at-risk students
const generateStudentTable = (students) => {
  if (!students || students.length === 0) {
    return '<p>No at-risk students found.</p>';
  }

  const tableRows = students.map(student => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 12px; text-align: left; font-weight: 500;">${student.student_id}</td>
      <td style="padding: 12px; text-align: center;">${student.attendance_pct}%</td>
      <td style="padding: 12px; text-align: center;">${student.avg_score}</td>
      <td style="padding: 12px; text-align: center;">${student.score_trend >= 0 ? '+' : ''}${student.score_trend}</td>
      <td style="padding: 12px; text-align: center;">$${student.fee_pending}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="
          padding: 4px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: 500;
          ${student.risk_level === 'High Risk' ? 'background-color: #fee2e2; color: #dc2626;' : 'background-color: #fef3c7; color: #d97706;'}
        ">
          ${student.risk_level}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">At-Risk Students Alert</h2>
      <p style="color: #6b7280; margin-bottom: 20px;">
        The following students have been identified as requiring immediate attention and counseling support:
      </p>
      
      <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Student ID</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Attendance %</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Avg Score</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Score Trend</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Fee Pending</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Risk Level</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">Recommended Actions:</h3>
        <ul style="color: #92400e; margin: 0; padding-left: 20px;">
          <li>Schedule individual counseling sessions</li>
          <li>Contact parents/guardians for support</li>
          <li>Implement academic intervention programs</li>
          <li>Monitor attendance and performance closely</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
        This alert was generated automatically by the AI-based Drop-out Prediction & Counseling Dashboard.
      </p>
    </div>
  `;
};

// Email sending endpoint
app.post('/send-alerts', async (req, res) => {
  try {
    const { recipients, subject, students } = req.body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipients array is required and must not be empty' 
      });
    }

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Students array is required' 
      });
    }

    // Validate email addresses
    const invalidEmails = recipients.filter(email => !validateEmail(email.trim()));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid email addresses: ${invalidEmails.join(', ')}` 
      });
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env file' 
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    // Generate HTML content
    const htmlContent = generateStudentTable(students);
    
    // Prepare email options
    const mailOptions = {
      from: {
        name: 'Student Analytics Dashboard',
        address: process.env.EMAIL_USER
      },
      to: recipients.join(', '),
      subject: subject || 'At-Risk Students Alert',
      html: htmlContent,
      text: `At-Risk Students Alert\n\nThis email contains information about ${students.length} students who require immediate attention. Please check the HTML version for detailed information.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      recipients: recipients,
      studentsCount: students.length,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: `Alert sent successfully to ${recipients.length} recipient(s)`,
      messageId: info.messageId,
      studentsCount: students.length
    });

  } catch (error) {
    console.error('Email sending failed:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Provide specific error messages for common issues
    let errorMessage = 'Failed to send email alert';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your EMAIL_USER and EMAIL_PASS credentials.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'SMTP server not found. Please check your internet connection.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Failed to connect to SMTP server. Please check your network settings.';
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

// Test email configuration endpoint
app.post('/test-email', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        success: false, 
        error: 'Email credentials not configured' 
      });
    }

    const transporter = createTransporter();
    await transporter.verify();

    res.json({ 
      success: true, 
      message: 'Email configuration is valid' 
    });
  } catch (error) {
    console.error('Email configuration test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Email configuration test failed',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Warning: Email credentials not found in .env file');
    console.log('   Please create a .env file with EMAIL_USER and EMAIL_PASS');
  }
});

module.exports = app;