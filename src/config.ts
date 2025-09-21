export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const EMAIL_CONFIG = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587,
  SECURE: false
};
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
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