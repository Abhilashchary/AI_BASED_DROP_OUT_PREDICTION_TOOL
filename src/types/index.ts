export interface StudentData {
  student_id: string;
  attended?: number;
  total_classes?: number;
  test1?: number;
  test2?: number;
  test3?: number;
  fee_pending?: number;
}

export interface ProcessedStudentData extends StudentData {
  attendance_pct: number;
  avg_score: number;
  score_trend: number;
  risk_level: string;
}

export interface UploadedFile {
  name: string;
  data: any[];
}