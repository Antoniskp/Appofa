'use client';

import { useState, useRef } from 'react';
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

// Default 8-colour palette (used when no custom colour is set)
const DEFAULT_PALETTE = [
  '#3B82F6', // blue-600
  '#10B981', // green-600
  '#F97316', // orange-600
  '#8B5CF6', // purple-600
  '#EC4899', // pink-600
  '#F59E0B', // amber-600
  '#14B8A6', // teal-600
  '#EF4444', // red-600
];

// Binary poll defaults
const BINARY_GREEN = '#10B981';
const BINARY_RED   = '#EF4444';

/**
 * Resolve the display colour for a single option following the priority rules:
 * 1. option.color (custom)
 * 2. binary defaults (green/red by index)
 * 3. palette cycling
 */
function resolveOptionColor(option, index, isBinary) {
  if (option.color) return option.color;
  if (isBinary) return index === 0 ? BINARY_GREEN : BINARY_RED;
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

/** Convert a hex colour to rgba with the given alpha. */
function hexToRgba(hex, alpha) {
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
  const chartRef = useRef(null);
  
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
  const isBinary = poll.type === 'binary';
  const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);

  // Assign colours BEFORE sorting so each option keeps its intended colour
  const optionsWithStats = options.map((option, index) => ({
    ...option,
    voteCount: option.voteCount || 0,
    percentage: totalVotes > 0 ? ((option.voteCount || 0) / totalVotes * 100).toFixed(1) : 0,
    resolvedColor: resolveOptionColor(option, index, isBinary),
  }));
  
  // Sort by vote count descending (colours stay with their option)
  optionsWithStats.sort((a, b) => b.voteCount - a.voteCount);
  
  // Chart data — build colour arrays from per-option resolved colours
  const chartData = {
    labels: optionsWithStats.map(opt => opt.text),
    datasets: [
      {
        label: 'Ψήφοι',
        data: optionsWithStats.map(opt => opt.voteCount),
        backgroundColor: optionsWithStats.map(opt => hexToRgba(opt.resolvedColor, 0.8)),
        borderColor: optionsWithStats.map(opt => opt.resolvedColor),
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
    const canvas = chartRef.current?.querySelector('canvas');
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
        <BinarySplitBar options={optionsWithStats} totalVotes={totalVotes} />
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
        <div ref={chartRef} style={{ height: '400px' }}>
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
          {optionsWithStats.map((option, index) => (
            <div key={option.id} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white"
                    style={{ backgroundColor: option.resolvedColor }}
                  >
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
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ width: `${option.percentage}%`, backgroundColor: option.resolvedColor }}
                ></div>
              </div>
            </div>
          ))}
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
function BinarySplitBar({ options, totalVotes }) {
  // Display in original order (order 0 = yes/agree, order 1 = no/disagree)
  const sorted = [...options].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [opt1, opt2] = sorted;

  const pct1 = totalVotes > 0 ? parseFloat(opt1.percentage) : 50;
  const pct2 = totalVotes > 0 ? parseFloat(opt2.percentage) : 50;

  // Use resolved colours (already set on each option by the parent)
  const color1 = opt1.resolvedColor || BINARY_GREEN;
  const color2 = opt2.resolvedColor || BINARY_RED;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-base font-semibold text-gray-700 mb-4 text-center">Αποτέλεσμα</h3>

      {/* Labels */}
      <div className="flex justify-between text-sm font-medium mb-2">
        <span style={{ color: color1 }}>{opt1.text}</span>
        <span style={{ color: color2 }}>{opt2.text}</span>
      </div>

      {/* Split bar */}
      <div className="flex w-full h-8 rounded-full overflow-hidden">
        <div
          className="flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
          style={{ width: `${pct1}%`, backgroundColor: color1 }}
        >
          {pct1 > 8 && `${pct1}%`}
        </div>
        <div
          className="flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
          style={{ width: `${pct2}%`, backgroundColor: color2 }}
        >
          {pct2 > 8 && `${pct2}%`}
        </div>
      </div>

      {/* Percentages below */}
      <div className="flex justify-between text-sm mt-2">
        <span className="font-bold" style={{ color: color1 }}>{pct1}%</span>
        <span className="font-bold" style={{ color: color2 }}>{pct2}%</span>
      </div>

      {/* Total votes */}
      <div className="text-center text-sm text-gray-500 mt-3">
        {totalVotes} {totalVotes === 1 ? 'ψήφος' : 'ψήφοι'} συνολικά
      </div>
    </div>
  );
}

