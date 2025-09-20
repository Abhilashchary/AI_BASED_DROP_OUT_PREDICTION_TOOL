import React, { useState } from 'react';
import { ProcessedStudentData } from '../types';
import { Download, Mail, Settings, Send, CheckCircle, XCircle } from 'lucide-react';

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

      const response = await fetch('http://localhost:3001/send-alerts', {
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
          message: `Email sent successfully to ${recipients.length} mentor(s). ${result.studentsCount} at-risk students reported.`
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
        message: 'Failed to connect to email server. Make sure the backend is running on port 3001 and .env file is configured.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Export At-Risk Students</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            CSV Export
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Export {atRiskStudents.length} at-risk students (At Risk + High Risk) to CSV file
          </p>
          <button
            onClick={exportToCSV}
            disabled={atRiskStudents.length === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download at_risk_students.csv
          </button>
        </div>

        {/* Email Notifications */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-green-600" />
            Email Notifications
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Send real-time alerts to mentors about {atRiskStudents.length} at-risk students
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setShowEmailConfig(!showEmailConfig)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              {showEmailConfig ? 'Hide' : 'Show'} Email Settings
            </button>
            <button
              onClick={sendEmailToMentors}
              disabled={atRiskStudents.length === 0 || isSendingEmail}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSendingEmail ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending Email...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email to Mentors
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Email Status */}
      {emailStatus.type && (
        <div className={`mt-4 p-4 rounded-lg border flex items-center gap-3 ${
          emailStatus.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {emailStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <p className="text-sm">{emailStatus.message}</p>
        </div>
      )}

      {/* Email Configuration Panel */}
      {showEmailConfig && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h5 className="font-medium text-gray-800 mb-4">Email Configuration</h5>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mentor Email Addresses</label>
            <textarea
              value={emailConfig.mentorEmails}
              onChange={(e) => setEmailConfig({...emailConfig, mentorEmails: e.target.value})}
              placeholder="mentor1@school.edu, mentor2@school.edu"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple email addresses with commas
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h6 className="text-sm font-medium text-blue-800 mb-2">Backend Configuration Required</h6>
            <p className="text-xs text-blue-700">
              Email credentials are configured on the backend server (.env file) for security. 
              Make sure the Node.js server is running with proper EMAIL_USER and EMAIL_PASS settings.
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="font-medium text-blue-800 mb-2">Export Summary</h5>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Total students analyzed: {data.length}</p>
          <p>• At-risk students: {atRiskStudents.filter(s => s.risk_level === 'At Risk').length}</p>
          <p>• High-risk students: {atRiskStudents.filter(s => s.risk_level === 'High Risk').length}</p>
          <p>• Ready for export: {atRiskStudents.length} students</p>
          <p>• Email notifications: {emailConfig.mentorEmails.split(',').filter(e => e.trim()).length} mentor(s) configured</p>
        </div>
      </div>
    </div>
  );
};