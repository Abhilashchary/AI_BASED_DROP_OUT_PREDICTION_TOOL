import React from 'react';
import Plot from 'react-plotly.js';
import { ProcessedStudentData } from '../types';

interface PerformanceScatterPlotProps {
  data: ProcessedStudentData[];
}

export const PerformanceScatterPlot: React.FC<PerformanceScatterPlotProps> = ({ data }) => {
  if (data.length === 0) return null;

  const riskLevels = ['Safe', 'At Risk', 'High Risk'];
  const colors = ['#10B981', '#F59E0B', '#EF4444'];

  const plotData = riskLevels.map((risk, index) => {
    const filteredData = data.filter(s => s.risk_level === risk);
    return {
      x: filteredData.map(s => s.attendance_pct),
      y: filteredData.map(s => s.avg_score),
      mode: 'markers' as const,
      type: 'scatter' as const,
      name: risk,
      marker: {
        color: colors[index],
        size: 8,
        line: {
          color: 'white',
          width: 1
        }
      },
      text: filteredData.map(s => s.student_id),
      hovertemplate: '<b>%{text}</b><br>' +
                    'Attendance: %{x:.1f}%<br>' +
                    'Avg Score: %{y:.1f}<br>' +
                    'Risk: ' + risk + '<extra></extra>'
    };
  });

  const layout = {
    title: {
      text: 'Student Performance vs Attendance',
      font: { size: 18, color: '#1F2937' }
    },
    xaxis: {
      title: 'Attendance Percentage (%)',
      titlefont: { size: 14, color: '#374151' },
      tickfont: { size: 12, color: '#6B7280' },
      range: [0, 100]
    },
    yaxis: {
      title: 'Average Score',
      titlefont: { size: 14, color: '#374151' },
      tickfont: { size: 12, color: '#6B7280' },
      range: [0, 100]
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 60, r: 40, b: 60, l: 60 },
    height: 500,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: '#E5E7EB',
      borderwidth: 1
    },
    shapes: [
      // Attendance threshold line at 75%
      {
        type: 'line',
        x0: 75,
        x1: 75,
        y0: 0,
        y1: 100,
        line: {
          color: '#F59E0B',
          width: 2,
          dash: 'dash'
        }
      },
      // Score threshold line at 50
      {
        type: 'line',
        x0: 0,
        x1: 100,
        y0: 50,
        y1: 50,
        line: {
          color: '#F59E0B',
          width: 2,
          dash: 'dash'
        }
      }
    ],
    annotations: [
      {
        x: 77,
        y: 95,
        text: 'Attendance<br>Threshold',
        showarrow: false,
        font: { size: 10, color: '#F59E0B' }
      },
      {
        x: 95,
        y: 52,
        text: 'Score Threshold',
        showarrow: false,
        font: { size: 10, color: '#F59E0B' }
      }
    ]
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
};