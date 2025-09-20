import React from 'react';
import { ProcessedStudentData } from '../types';
import { TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';

interface StatisticsProps {
  data: ProcessedStudentData[];
}

export const Statistics: React.FC<StatisticsProps> = ({ data }) => {
  if (data.length === 0) return null;

  const totalStudents = data.length;
  const highRiskStudents = data.filter(s => s.risk_level === 'High Risk').length;
  const atRiskStudents = data.filter(s => s.risk_level === 'At Risk').length;
  const safeStudents = data.filter(s => s.risk_level === 'Safe').length;
  
  const avgAttendance = data.reduce((sum, s) => sum + s.attendance_pct, 0) / totalStudents;
  const avgScore = data.reduce((sum, s) => sum + s.avg_score, 0) / totalStudents;
  const totalFeePending = data.reduce((sum, s) => sum + s.fee_pending, 0);
  
  const positiveScoreTrend = data.filter(s => s.score_trend > 0).length;

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'High Risk Students',
      value: highRiskStudents.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Average Attendance',
      value: `${avgAttendance.toFixed(1)}%`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Average Score',
      value: avgScore.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Improving Students',
      value: positiveScoreTrend.toString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Fee Pending',
      value: `$${totalFeePending.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Analytics Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className={`p-3 rounded-full ${stat.bgColor} mr-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Risk Distribution</h4>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Safe: {safeStudents} ({((safeStudents / totalStudents) * 100).toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            At Risk: {atRiskStudents} ({((atRiskStudents / totalStudents) * 100).toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            High Risk: {highRiskStudents} ({((highRiskStudents / totalStudents) * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
};