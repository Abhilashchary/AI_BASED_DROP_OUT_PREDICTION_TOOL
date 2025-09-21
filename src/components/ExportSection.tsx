import React, { useState, useEffect } from 'react';
import { ProcessedStudentData } from '../types';
import { Download, Mail, Settings, Send, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface ExportSectionProps {
  data: ProcessedStudentData[];
}

export const ExportSection: React.FC<ExportSectionProps> = ({ data }) => {
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  const [mentorEmails, setMentorEmails] = useState<string[]>(['']);

  const atRiskStudents = data.filter(s => s.risk_level === 'At Risk' || s.risk_level === 'High Risk');

  // Clear status message after timeout to prevent memory leak
  useEffect(() => {
    if (emailStatus.type) {
      const timer = setTimeout(() => {
        setEmailStatus({ type: null, message: '' });
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [emailStatus.type]);

  // CSV Export Function (remains the same as it's safe)
  const exportToCSV = () => {
    // ... (code is unchanged)
    try {
      if (atRiskStudents.length === 0) {
        setEmailStatus({type: 'error', message: 'No at-risk students to export'});
        return;
      }

      const headers = ['Student ID', 'Attendance %', 'Average Score', 'Score Trend', 'Fee Pending', 'Risk Level'];
      const csvRows = [
        headers.join(','),
        ...atRiskStudents.map(student => [
          `"${student.student_id}"`,
          student.attendance_pct,
          student.avg_score,
          student.score_trend,
          student.fee_pending,
          `"${student.risk_level}"`
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `at_risk_students_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setEmailStatus({type: 'success', message: `Successfully exported ${atRiskStudents.length} at-risk students to CSV`});
      
    } catch (error) {
      console.error('CSV Export Error:', error);
      setEmailStatus({type: 'error', message: 'Failed to export CSV file'});
    }
  };

  // Email Management Functions
  const addEmailField = () => {
    setMentorEmails([...mentorEmails, '']);
  };

  const removeEmailField = (index: number) => {
    if (mentorEmails.length > 1) {
      setMentorEmails(mentorEmails.filter((_, i) => i !== index));
    }
  };

  const updateEmailField = (index: number, value: string) => {
    const updatedEmails = [...mentorEmails];
    updatedEmails[index] = value;
    setMentorEmails(updatedEmails);
  };

  // Email Validation (simplified as there are no credentials to validate on the frontend)
  const validateMentorEmails = (): { isValid: boolean; message: string } => {
    if (atRiskStudents.length === 0) {
      return { isValid: false, message: 'No at-risk students to report' };
    }
    const validEmails = mentorEmails.filter(email => email.trim().length > 0);
    if (validEmails.length === 0) {
      return { isValid: false, message: 'Please enter at least one mentor email address' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email.trim()));
    if (invalidEmails.length > 0) {
      return { isValid: false, message: `Invalid email addresses: ${invalidEmails.join(', ')}` };
    }
    return { isValid: true, message: '' };
  };

  // Send Email Function
  const sendEmailToMentors = async () => {
    const validation = validateMentorEmails();
    if (!validation.isValid) {
      setEmailStatus({ type: 'error', message: validation.message });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus({ type: null, message: '' });

    try {
      const validEmails = mentorEmails.filter(email => email.trim().length > 0);
      
      const response = await fetch(`${API_BASE_URL}/send-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: validEmails.map(email => email.trim()),
          subject: `At-Risk Students Alert - ${new Date().toLocaleDateString()}`,
          students: atRiskStudents
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setEmailStatus({
          type: 'success', 
          message: `Email sent successfully to ${result.recipientsCount} mentor(s). ${result.studentsCount} at-risk students reported.`
        });
      } else {
        setEmailStatus({ type: 'error', message: result.error || 'Failed to send email' });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      let errorMessage = 'Failed to send email. Check if the backend server is running and configured correctly.';
      setEmailStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Export & Notifications</h3>
          <p className="text-sm text-gray-600 mt-1">
            {atRiskStudents.length} at-risk students found
          </p>
        </div>
        <button
          onClick={() => setShowEmailConfig(!showEmailConfig)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Mail className="w-4 h-4" />
          {showEmailConfig ? 'Hide Email Config' : 'Email Mentors'}
        </button>
      </div>

      {emailStatus.type && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          emailStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {emailStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <p className="text-sm">{emailStatus.message}</p>
        </div>
      )}

      {showEmailConfig && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-semibold text-gray-800 mb-4">Send Report via Email</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentor Email Addresses
            </label>
            {mentorEmails.map((email, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmailField(index, e.target.value)}
                  placeholder="mentor@school.edu"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {mentorEmails.length > 1 && (
                  <button
                    onClick={() => removeEmailField(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addEmailField}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Another Email
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h5 className="text-sm font-semibold text-blue-800 mb-2">Note:</h5>
            <p className="text-xs text-blue-700">
              Email functionality is configured on the server. Please ensure the backend server has valid credentials set in its `.env` file before sending emails.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <button
          onClick={exportToCSV}
          disabled={atRiskStudents.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV ({atRiskStudents.length} students)
        </button>

        <button
          onClick={sendEmailToMentors}
          disabled={atRiskStudents.length === 0 || isSendingEmail}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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

      {atRiskStudents.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">At-Risk Students Summary:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• High Risk: {atRiskStudents.filter(s => s.risk_level === 'High Risk').length} students</p>
            <p>• At Risk: {atRiskStudents.filter(s => s.risk_level === 'At Risk').length} students</p>
            <p>• Total requiring attention: {atRiskStudents.length} students</p>
          </div>
        </div>
      )}
    </div>
  );
};