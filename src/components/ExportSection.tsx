import React, { useState, useEffect } from 'react';
import { ProcessedStudentData } from '../types';
import { Download, Mail, Send, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { APP_CONFIG } from '../config';

// Ensure this is the correct URL for your backend server in the web container
const API_BASE_URL = 'https://zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--3001--96435430.local-credentialless.webcontainer-api.io';

// ... (existing imports and interfaces)

export const ExportSection: React.FC<ExportSectionProps> = ({ data }) => {
  // ... (existing state variables)

  // ... (existing helper functions)

  const sendEmailToMentors = async () => {
    const validation = validateMentorEmails();
    if (!validation.isValid) {
      setEmailStatus({ type: 'error', message: validation.message });
      return;
    }

    setEmailStatus({ type: null, message: 'Sending email...' });

    const validEmails = mentorEmails.filter(email => email.trim().length > 0).map(email => email.trim());
    const emailData = {
      to: validEmails.join(','),
      atRiskStudents: atRiskStudents
    };

    try {
      const response = await fetch(`${API_BASE_URL}/send-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setEmailStatus({ type: 'success', message: result.message });
    } catch (error: any) {
      console.error("Email sending error:", error);
      setEmailStatus({ type: 'error', message: error.message });
    }
  };

  // ... (rest of the component's JSX remains the same)
};