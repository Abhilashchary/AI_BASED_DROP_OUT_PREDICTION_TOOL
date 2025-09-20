# AI-based Drop-out Prediction & Counseling Dashboard

A comprehensive full-stack application for analyzing student data and predicting dropout risk with automated email notifications to mentors.

## Features

### Frontend (React + TypeScript)
- **Excel File Processing**: Upload and process attendance, marks, and fees data
- **Smart Column Detection**: Automatically detects column variations (StudentID, ID, student_id, etc.)
- **Data Visualization**: Interactive Plotly charts showing risk distribution and performance correlation
- **Risk Assessment**: AI-powered categorization of students (Safe, At Risk, High Risk)
- **Export Functionality**: Download at-risk students as CSV
- **Real-time Email Notifications**: Send alerts to mentors with detailed student information

### Backend (Node.js + Express)
- **Email Service**: Nodemailer integration with Gmail SMTP
- **Secure Configuration**: Environment-based credential management
- **HTML Email Templates**: Professional formatted emails with student data tables
- **Error Handling**: Comprehensive error logging and user feedback
- **Health Checks**: API endpoints for testing email configuration

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email Settings
Create a `.env` file in the root directory:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3001
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Go to Google Account Settings > Security > App Passwords
3. Generate an app password for "Mail"
4. Use the 16-character app password as `EMAIL_PASS`

### 3. Run the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```

**Terminal 2 - Frontend Development:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend API will be available at `http://localhost:3001`

## Usage

### 1. Upload Excel Files
- **attendance.xlsx**: student_id, attended, total_classes
- **marks.xlsx**: student_id, test1, test2, test3  
- **fees.xlsx**: student_id, fee_pending

### 2. Analyze Data
Click "Analyze Data" to process and merge all files with automatic:
- Missing value handling
- Risk level calculation
- Performance metrics computation

### 3. View Results
- **Statistics Dashboard**: Overview of student risk distribution
- **Interactive Charts**: Risk distribution bar chart and performance scatter plot
- **Detailed Table**: Color-coded student data with all metrics

### 4. Export & Notify
- **CSV Export**: Download at-risk students data
- **Email Alerts**: Send formatted notifications to mentors

## API Endpoints

### POST /send-alerts
Send email notifications to mentors
```json
{
  "recipients": ["mentor1@school.edu", "mentor2@school.edu"],
  "subject": "At-Risk Students Alert",
  "students": [/* array of at-risk student objects */]
}
```

### GET /health
Check server and email configuration status

### POST /test-email
Test email configuration without sending actual emails

## File Structure

```
├── src/
│   ├── components/
│   │   ├── DataTable.tsx           # Student data table with risk color coding
│   │   ├── ExportSection.tsx       # CSV export and email notifications
│   │   ├── FileUploader.tsx        # Excel file upload interface
│   │   ├── PerformanceScatterPlot.tsx # Attendance vs performance chart
│   │   ├── RiskDistributionChart.tsx   # Risk level distribution chart
│   │   └── Statistics.tsx          # Analytics overview dashboard
│   ├── utils/
│   │   └── excelProcessor.ts       # Excel file processing and data merging
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   └── App.tsx                    # Main application component
├── server.js                      # Node.js backend with email service
├── .env.example                   # Environment variables template
└── package.json                   # Dependencies and scripts
```

## Risk Assessment Algorithm

Students are categorized based on:
- **High Risk**: Attendance < 60% OR Average Score < 35
- **At Risk**: Attendance < 75% OR Average Score < 50  
- **Safe**: Above both thresholds

## Email Template Features

- Professional HTML formatting
- Responsive design
- Color-coded risk levels
- Detailed student metrics table
- Actionable recommendations for mentors
- Automatic timestamp and branding

## Security Notes

- Email credentials stored in environment variables
- No sensitive data in frontend code
- CORS enabled for development
- Input validation on all API endpoints
- Comprehensive error handling and logging

## Troubleshooting

### Email Issues
1. Verify `.env` file exists with correct credentials
2. Check Gmail app password (not regular password)
3. Ensure 2FA is enabled on Gmail account
4. Check server logs for detailed error messages

### Backend Connection
1. Ensure backend is running on port 3001
2. Check CORS configuration if requests fail
3. Verify all dependencies are installed

## Production Deployment

1. Set environment variables on your hosting platform
2. Update CORS origins for production domain
3. Use secure HTTPS endpoints
4. Consider using a dedicated SMTP service (SendGrid, AWS SES)
5. Implement rate limiting for email endpoints

## License

MIT License - feel free to use this for educational institutions and student support programs.