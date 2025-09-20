import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { DataTable } from './components/DataTable';
import { Statistics } from './components/Statistics';
import { RiskDistributionChart } from './components/RiskDistributionChart';
import { PerformanceScatterPlot } from './components/PerformanceScatterPlot';
import { ExportSection } from './components/ExportSection';
import { ProcessedStudentData } from './types';
import { 
  readExcelFile, 
  detectColumns, 
  standardizeData, 
  mergeData, 
  processData 
} from './utils/excelProcessor';
import { BarChart3, FileSpreadsheet, AlertCircle, Brain } from 'lucide-react';

function App() {
  const [attendanceFile, setAttendanceFile] = useState<File | null>(null);
  const [marksFile, setMarksFile] = useState<File | null>(null);
  const [feesFile, setFeesFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedStudentData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async () => {
    if (!attendanceFile || !marksFile || !feesFile) {
      setError('Please upload all three Excel files');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Read all files
      const [attendanceData, marksData, feesData] = await Promise.all([
        readExcelFile(attendanceFile),
        readExcelFile(marksFile),
        readExcelFile(feesFile)
      ]);

      // Detect and standardize columns
      const attendanceColumns = detectColumns(attendanceData, ['student_id', 'attended', 'total_classes']);
      const marksColumns = detectColumns(marksData, ['student_id', 'test1', 'test2', 'test3']);
      const feesColumns = detectColumns(feesData, ['student_id', 'fee_pending']);

      // Standardize data
      const standardizedAttendance = standardizeData(attendanceData, attendanceColumns, 'attendance');
      const standardizedMarks = standardizeData(marksData, marksColumns, 'marks');
      const standardizedFees = standardizeData(feesData, feesColumns, 'fees');

      // Merge and process data
      const mergedData = mergeData(standardizedAttendance, standardizedMarks, standardizedFees);
      const processed = processData(mergedData);

      setProcessedData(processed);
    } catch (err) {
      setError(`Error processing files: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [attendanceFile, marksFile, feesFile]);

  const clearAll = useCallback(() => {
    setAttendanceFile(null);
    setMarksFile(null);
    setFeesFile(null);
    setProcessedData([]);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI-based Drop-out Prediction & Counseling Dashboard</h1>
                <p className="text-gray-600">Advanced analytics for student risk assessment and intervention</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {processedData.length} students analyzed
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Uploaded Data
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <FileUploader
              title="Attendance Data"
              description="Upload attendance.xlsx containing student attendance records"
              file={attendanceFile}
              onFileSelect={setAttendanceFile}
            />
            <FileUploader
              title="Marks Data"
              description="Upload marks.xlsx containing test scores for each student"
              file={marksFile}
              onFileSelect={setMarksFile}
            />
            <FileUploader
              title="Fees Data"
              description="Upload fees.xlsx containing fee payment status"
              file={feesFile}
              onFileSelect={setFeesFile}
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={processFiles}
              disabled={!attendanceFile || !marksFile || !feesFile || isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Analyze Data
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {processedData.length > 0 && (
          <div className="space-y-8">
            {/* Analytics Overview */}
            <Statistics data={processedData} />
            
            {/* Student Risk Table */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Student Risk Table
              </h2>
              <DataTable 
                data={processedData} 
                title="Comprehensive Student Analysis" 
              />
            </div>
            
            {/* Risk Distribution Chart */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Risk Distribution
              </h2>
              <RiskDistributionChart data={processedData} />
            </div>
            
            {/* Performance Scatter Plot */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Performance Scatter Plot
              </h2>
              <PerformanceScatterPlot data={processedData} />
            </div>
            
            {/* Export Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Export At-Risk Students
              </h2>
              <ExportSection data={processedData} />
            </div>
            <DataTable 
              data={processedData} 
              title="Student Analysis Results" 
            />
          </div>
        )}

        {/* Instructions */}
        {processedData.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Get Started with AI-Powered Student Analytics
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Upload your Excel files to unlock powerful insights about student performance, attendance patterns, 
              and dropout risk assessment. Our AI-powered system provides actionable recommendations for student counseling.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
              <h4 className="font-semibold text-gray-800 mb-3">Expected File Formats:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><strong>attendance.xlsx:</strong> student_id, attended, total_classes</li>
                <li><strong>marks.xlsx:</strong> student_id, test1, test2, test3</li>
                <li><strong>fees.xlsx:</strong> student_id, fee_pending</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">
                Column names are automatically detected even with slight variations (e.g., "StudentID", "ID", "student_id")
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;