import React from 'react';
import Plot from 'react-plotly.js';
import { ProcessedStudentData } from '../types';

interface RiskDistributionChartProps {
  data: ProcessedStudentData[];
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  const riskCounts = {
    'Safe': data.filter(s => s.risk_level === 'Safe').length,
    'At Risk': data.filter(s => s.risk_level === 'At Risk').length,
    'High Risk': data.filter(s => s.risk_level === 'High Risk').length
  };

  const plotData = [{
    x: Object.keys(riskCounts),
    y: Object.values(riskCounts),
    type: 'bar' as const,
    marker: {
      color: ['#10B981', '#F59E0B', '#EF4444'],
      line: {
        color: ['#059669', '#D97706', '#DC2626'],
        width: 2
      }
    },
    text: Object.values(riskCounts).map(count => count.toString()),
    textposition: 'auto' as const,
    hovertemplate: '<b>%{x}</b><br>Students: %{y}<extra></extra>'
  }];

  const layout = {
    title: {
      text: 'Student Risk Distribution',
      font: { size: 18, color: '#1F2937' }
    },
    xaxis: {
      title: 'Risk Level',
      titlefont: { size: 14, color: '#374151' },
      tickfont: { size: 12, color: '#6B7280' }
    },
    yaxis: {
      title: 'Number of Students',
      titlefont: { size: 14, color: '#374151' },
      tickfont: { size: 12, color: '#6B7280' }
    },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 60, r: 40, b: 60, l: 60 },
    height: 400
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
        style={{ width: '100%', height: '400px' }}
      />
    </div>
  );
};