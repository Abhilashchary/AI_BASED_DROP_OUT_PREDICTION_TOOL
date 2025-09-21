// We can remove the API_BASE_URL since we're not making API calls for email anymore.

// Email Configuration (no longer used by frontend)
export const EMAIL_CONFIG = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SECURE: false
};

// Application Configuration
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['.xlsx', '.xls'],
  RISK_THRESHOLDS: {
    HIGH_RISK: {
      ATTENDANCE: 60,
      SCORE: 35
    },
    AT_RISK: {
      ATTENDANCE: 75,
      SCORE: 50
    }
  }
};