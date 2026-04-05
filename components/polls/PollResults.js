'use client';

import { useState } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ArrowDownTrayIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { pollAPI } from '@/lib/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Convert a hex colour string to an rgba() CSS value.
 */
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Poll results visualization component with Chart.js
 * @param {Object} poll - Poll object with options and vote counts
 * @param {boolean} canView - Whether user can view results
 * @param {boolean} canEdit - Whether user has edit rights (can access auditable export)
 */
export default function PollResults({ poll, canView = true, canEdit = false }) {
  const [chartType, setChartType] = useState('bar'); // 'bar', 'pie', 'doughnut'
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);
  
  if (!canView) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">
          Τα αποτελέσματα δεν είναι διαθέσιμα αυτή τη στιγμή.
        </p>
      </div>
    );
  }
  
  // Calculate vote counts and percentages
  const options = poll.options || [];
  const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);
  
  const optionsWithStats = options.map(option => ({
    ...option,
    voteCount: option.voteCount || 0,
    percentage: totalVotes > 0 ? ((option.voteCount || 0) / totalVotes * 100).toFixed(1) : 0,
  }));
  
  // Sort by vote count descending
  optionsWithStats.sort((a, b) => b.voteCount - a.voteCount);
  
  // Chart data
  const defaultBackgroundColors = [
    'rgba(59, 130, 246, 0.8)',   // blue-600
    'rgba(16, 185, 129, 0.8)',   // green-600
    'rgba(251, 146, 60, 0.8)',   // orange-600
    'rgba(139, 92, 246, 0.8)',   // purple-600
    'rgba(236, 72, 153, 0.8)',   // pink-600
    'rgba(245, 158, 11, 0.8)',   // amber-600
    'rgba(20, 184, 166, 0.8)',   // teal-600
    'rgba(239, 68, 68, 0.8)',    // red-600
  ];
  const defaultBorderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(251, 146, 60, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(20, 184, 166, 1)',
    'rgba(239, 68, 68, 1)',
  ];

  const chartBackgroundColors = poll.useCustomColors
    ? optionsWithStats.map(opt => opt.color ? hexToRgba(opt.color, 0.8) : 'rgba(59, 130, 246, 0.8)')
    : defaultBackgroundColors;

  const chartBorderColors = poll.useCustomColors
    ? optionsWithStats.map(opt => opt.color ? hexToRgba(opt.color, 1) : 'rgba(59, 130, 246, 1)')
    : defaultBorderColors;

  const chartData = {
    labels: optionsWithStats.map(opt => opt.text),
    datasets: [
      {
        label: 'Ψήφοι',
        data: optionsWithStats.map(opt => opt.voteCount),
        backgroundColor: chartBackgroundColors,
        borderColor: chartBorderColors,
        borderWidth: 2,
      },
    ],
  };
  
  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Αποτελέσματα Ψηφοφορίας',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${value} ψήφοι (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Αποτελέσματα Ψηφοφορίας',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} ψήφοι (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const handleExportChart = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `poll-${poll.id}-results.png`;
      link.href = url;
      link.click();
    }
    setExportMenuOpen(false);
  };

  const handleExportJson = async () => {
    setIsExportingJson(true);
    setExportMenuOpen(false);
    try {
      const response = await pollAPI.exportData(poll.id);
      if (response.success) {
        const json = JSON.stringify(response.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `poll-${poll.id}-audit.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export poll data:', err);
    } finally {
      setIsExportingJson(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Binary poll — special split-bar view */}
      {poll.type === 'binary' && options.length === 2 && (
        <BinarySplitBar options={optionsWithStats} totalVotes={totalVotes} useCustomColors={poll.useCustomColors} />
      )}

      {/* Chart Type Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ράβδοι
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              chartType === 'pie'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Πίτα
          </button>
          <button
            onClick={() => setChartType('doughnut')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              chartType === 'doughnut'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ντόνατς
          </button>
        </div>
        
        {/* Export controls */}
        {canEdit ? (
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-medium"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Εξαγωγή
              <ChevronDownIcon className="h-3 w-3" />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={handleExportChart}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-md"
                >
                  Εξαγωγή ως PNG
                </button>
                <button
                  onClick={handleExportJson}
                  disabled={isExportingJson}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExportingJson ? 'Γίνεται λήψη...' : 'Εξαγωγή δεδομένων (JSON)'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleExportChart}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-medium"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Εξαγωγή
          </button>
        )}
      </div>
      
      {/* Chart Display */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div style={{ height: '400px' }}>
          {chartType === 'bar' && <Bar data={chartData} options={barOptions} />}
          {chartType === 'pie' && <Pie data={chartData} options={pieOptions} />}
          {chartType === 'doughnut' && <Doughnut data={chartData} options={pieOptions} />}
        </div>
      </div>
      
      {/* Detailed Results Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Λεπτομερή Αποτελέσματα</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {optionsWithStats.map((option, index) => {
            const hasCustomColor = poll.useCustomColors && option.color;
            const rankClassName = hasCustomColor
              ? 'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm'
              : 'flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm';
            const rankStyle = hasCustomColor
              ? { backgroundColor: hexToRgba(option.color, 0.15), color: option.color }
              : undefined;
            const progressClassName = hasCustomColor
              ? 'h-3 rounded-full transition-all duration-500'
              : 'bg-blue-600 h-3 rounded-full transition-all duration-500';
            const progressStyle = {
              width: `${option.percentage}%`,
              ...(hasCustomColor ? { backgroundColor: option.color } : {})
            };
            return (
              <div key={option.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={rankClassName} style={rankStyle}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{option.text}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{option.voteCount}</div>
                    <div className="text-sm text-gray-500">{option.percentage}%</div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={progressClassName} style={progressStyle}></div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Total Votes Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Σύνολο Ψήφων:</span>
            <span className="text-xl font-bold text-blue-600">{totalVotes}</span>
          </div>
          
          {poll.authenticatedVoteCount !== undefined && poll.unauthenticatedVoteCount !== undefined && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Συνδεδεμένοι χρήστες:</span>
                <span className="font-medium">{poll.authenticatedVoteCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Ανώνυμες ψήφοι:</span>
                <span className="font-medium">{poll.unauthenticatedVoteCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Split-bar result view for binary polls.
 * Shows a full-width horizontal bar split proportionally between the two options.
 */
function BinarySplitBar({ options, totalVotes, useCustomColors }) {
  // Display in original order (order 0 = yes/agree, order 1 = no/disagree)
  const sorted = [...options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [opt1, opt2] = sorted;

  const pct1 = totalVotes > 0 ? parseFloat(opt1.percentage) : 50;
  const pct2 = totalVotes > 0 ? parseFloat(opt2.percentage) : 50;

  const color1 = (useCustomColors && opt1.color) ? opt1.color : null;
  const color2 = (useCustomColors && opt2.color) ? opt2.color : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-700 mb-4 text-center">Αποτέλεσμα</h3>

      {/* Labels */}
      <div className="flex justify-between text-sm font-medium mb-2">
        <span
          className={color1 ? undefined : 'text-green-600'}
          style={color1 ? { color: color1 } : undefined}
        >
          {opt1.text}
        </span>
        <span
          className={color2 ? undefined : 'text-red-600'}
          style={color2 ? { color: color2 } : undefined}
        >
          {opt2.text}
        </span>
      </div>

      {/* Split bar */}
      <div className="flex w-full h-8 rounded-full overflow-hidden">
        <div
          className={color1
            ? 'flex items-center justify-center text-white text-xs font-bold transition-all duration-500'
            : 'bg-green-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500'}
          style={{ width: `${pct1}%`, ...(color1 ? { backgroundColor: color1 } : {}) }}
        >
          {pct1 > 8 && `${pct1}%`}
        </div>
        <div
          className={color2
            ? 'flex items-center justify-center text-white text-xs font-bold transition-all duration-500'
            : 'bg-red-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500'}
          style={{ width: `${pct2}%`, ...(color2 ? { backgroundColor: color2 } : {}) }}
        >
          {pct2 > 8 && `${pct2}%`}
        </div>
      </div>

      {/* Percentages below */}
      <div className="flex justify-between text-sm mt-2">
        <span
          className={color1 ? 'font-bold' : 'font-bold text-green-600'}
          style={color1 ? { color: color1 } : undefined}
        >
          {pct1}%
        </span>
        <span
          className={color2 ? 'font-bold' : 'font-bold text-red-600'}
          style={color2 ? { color: color2 } : undefined}
        >
          {pct2}%
        </span>
      </div>

      {/* Total votes */}
      <div className="text-center text-sm text-gray-500 mt-3">
        {totalVotes} {totalVotes === 1 ? 'ψήφος' : 'ψήφοι'} συνολικά
      </div>
    </div>
  );
}
