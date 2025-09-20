import React, { useState } from 'react';
import { ProcessedStudentData } from '../types';
import { Download, Mail, Settings, Send, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';   // ✅ NEW IMPORT

interface ExportSectionProps {
  data: ProcessedStudentData[];
}

export const ExportSection: React.FC<ExportSectionProps> = ({ data }) => {
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const [emailConfig, setEmailConfig] = useState({
    smtpServer: 'smtp.gmail.com',
    smtpPort: '587',
    username: 'your-email@gmail.com',
    password: '',
    mentorEmails: 'mentor1@school.edu, mentor2@school.edu'
  });

  const atRiskStudents = data.filter(s => s.risk_level === 'At Risk' || s.risk_level === 'High Risk');

  const exportToCSV = () => {
    if (atRiskStudents.length === 0) {
      alert('No at-risk students to export');
      return;
    }

    const headers = ['student_id', 'attendance_pct', 'avg_score', 'score_trend', 'fee_pending', 'risk_level'];
    const csvContent = [
      headers.join(','),
      ...atRiskStudents.map(student => [
        student.student_id,
        student.attendance_pct,
        student.avg_score,
        student.score_trend,
        student.fee_pending,
        student.risk_level
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'at_risk_students.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendEmailToMentors = async () => {
    if (atRiskStudents.length === 0) {
      setEmailStatus({type: 'error', message: 'No at-risk students to report'});
      return;
    }

    if (!emailConfig.mentorEmails.trim()) {
      setEmailStatus({type: 'error', message: 'Please enter mentor email addresses'});
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus({type: null, message: ''});

    try {
      const recipients = emailConfig.mentorEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      // Validate email addresses on frontend
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        setEmailStatus({
          type: 'error', 
          message: `Invalid email addresses: ${invalidEmails.join(', ')}`
        });
        setIsSendingEmail(false);
        return;
      }

      // ✅ Use API_BASE_URL instead of hardcoding localhost
      const response = await fetch(`${API_BASE_URL}/send-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject: `At-Risk Students Alert - ${new Date().toLocaleDateString()}`,
          students: atRiskStudents
        })
      });

      const result = await response.json();

      if (result.success) {
        setEmailStatus({
          type: 'success', 
          message: `Email sent successfully to ${recipients.length} mentor(s). ${atRiskStudents.length} at-risk students reported.`
        });
      } else {
        setEmailStatus({
          type: 'error', 
          message: result.error || 'Failed to send email'
        });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      setEmailStatus({
        type: 'error', 
        message: 'Failed to connect to email server. Make sure the backend is running and .env file is configured.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* unchanged UI code ... */}
    </div>
  );
};
