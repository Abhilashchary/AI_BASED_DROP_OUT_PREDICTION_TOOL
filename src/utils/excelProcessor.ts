import * as XLSX from 'xlsx';
import { StudentData, ProcessedStudentData } from '../types';

export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const detectColumns = (data: any[], expectedColumns: string[]): Record<string, string> => {
  if (data.length === 0) return {};
  
  const headers = Object.keys(data[0]);
  const columnMap: Record<string, string> = {};
  
  expectedColumns.forEach(expected => {
    const found = headers.find(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedExpected = expected.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedHeader.includes(normalizedExpected) || 
             normalizedExpected.includes(normalizedHeader) ||
             header.toLowerCase() === expected.toLowerCase();
    });
    if (found) {
      columnMap[expected] = found;
    }
  });
  
  return columnMap;
};

export const standardizeData = (data: any[], columnMap: Record<string, string>, type: string): StudentData[] => {
  return data.map(row => {
    const standardized: any = {};
    
    // Always try to find student_id
    const studentIdCol = columnMap.student_id || 
                        Object.keys(row).find(key => 
                          key.toLowerCase().includes('student') || 
                          key.toLowerCase().includes('id')
                        ) || 
                        Object.keys(row)[0];
    
    standardized.student_id = String(row[studentIdCol] || '').trim();
    
    // Process other columns based on file type
    if (type === 'attendance') {
      standardized.attended = parseFloat(row[columnMap.attended] || 0) || 0;
      standardized.total_classes = parseFloat(row[columnMap.total_classes] || 0) || 0;
    } else if (type === 'marks') {
      standardized.test1 = parseFloat(row[columnMap.test1] || '') || undefined;
      standardized.test2 = parseFloat(row[columnMap.test2] || '') || undefined;
      standardized.test3 = parseFloat(row[columnMap.test3] || '') || undefined;
    } else if (type === 'fees') {
      standardized.fee_pending = parseFloat(row[columnMap.fee_pending] || 0) || 0;
    }
    
    return standardized as StudentData;
  });
};

export const mergeData = (attendance: StudentData[], marks: StudentData[], fees: StudentData[]): StudentData[] => {
  const allStudentIds = new Set([
    ...attendance.map(s => s.student_id),
    ...marks.map(s => s.student_id),
    ...fees.map(s => s.student_id)
  ]);
  
  return Array.from(allStudentIds).map(studentId => {
    const attendanceData = attendance.find(s => s.student_id === studentId) || { student_id: studentId };
    const marksData = marks.find(s => s.student_id === studentId) || { student_id: studentId };
    const feesData = fees.find(s => s.student_id === studentId) || { student_id: studentId };
    
    return {
      student_id: studentId,
      attended: attendanceData.attended || 0,
      total_classes: attendanceData.total_classes || 0,
      test1: marksData.test1,
      test2: marksData.test2,
      test3: marksData.test3,
      fee_pending: feesData.fee_pending || 0
    };
  });
};

export const processData = (mergedData: StudentData[]): ProcessedStudentData[] => {
  // Calculate average scores for missing test score imputation
  const allScores = mergedData.flatMap(student => 
    [student.test1, student.test2, student.test3].filter(score => score !== undefined)
  );
  const globalAverage = allScores.length > 0 ? 
    allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
  
  return mergedData.map(student => {
    // Handle missing test scores
    const scores = [student.test1, student.test2, student.test3];
    const validScores = scores.filter(score => score !== undefined);
    const studentAverage = validScores.length > 0 ? 
      validScores.reduce((sum, score) => sum + score, 0) / validScores.length : globalAverage;
    
    const test1 = student.test1 !== undefined ? student.test1 : studentAverage;
    const test2 = student.test2 !== undefined ? student.test2 : studentAverage;
    const test3 = student.test3 !== undefined ? student.test3 : studentAverage;
    
    // Calculate derived metrics
    const attendance_pct = student.total_classes > 0 ? 
      (student.attended / student.total_classes) * 100 : 0;
    const avg_score = (test1 + test2 + test3) / 3;
    const score_trend = test3 - test1;
    
    // Calculate risk level
    let risk_level = 'Safe';
    if (attendance_pct < 60 || avg_score < 35) {
      risk_level = 'High Risk';
    } else if (attendance_pct < 75 || avg_score < 50) {
      risk_level = 'At Risk';
    }
    
    return {
      ...student,
      test1,
      test2,
      test3,
      attendance_pct: Math.round(attendance_pct * 100) / 100,
      avg_score: Math.round(avg_score * 100) / 100,
      score_trend: Math.round(score_trend * 100) / 100,
      risk_level
    };
  });
};