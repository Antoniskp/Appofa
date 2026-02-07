'use client';

import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
);

/**
 * Display poll results with charts and statistics
 * @param {Object} results - Results object from API with options and vote counts
 * @param {Object} poll - Poll object for context
 */
export default function PollResults({ results, poll }) {
  if (!results || !results.options || results.options.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">Δεν υπάρχουν ακόμα αποτελέσματα.</p>
      </div>
    );
  }

  const totalVotes = results.totalVotes || 0;
  const options = results.options || [];
  
  // Sort options by vote count
  const sortedOptions = [...options].sort((a, b) => b.voteCount - a.voteCount);
  
  // Prepare data for bar chart
  const barChartData = {
    labels: sortedOptions.map(opt => opt.optionText || opt.displayName || `Επιλογή ${opt.id}`),
    datasets: [
      {
        label: 'Ψήφοι',
        data: sortedOptions.map(opt => opt.voteCount || 0),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Κατανομή Ψήφων',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.x;
            const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
            return `${value} ψήφοι (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Prepare data for pie chart
  const pieChartData = {
    labels: sortedOptions.map(opt => opt.optionText || opt.displayName || `Επιλογή ${opt.id}`),
    datasets: [
      {
        label: 'Ποσοστό',
        data: sortedOptions.map(opt => opt.voteCount || 0),
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(132, 204, 22, 0.8)',
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(132, 204, 22, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 15,
          padding: 10,
        },
      },
      title: {
        display: true,
        text: 'Ποσοστιαία Κατανομή',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const percentage = totalVotes > 0 ? ((value / totalVotes) * 100).toFixed(1) : 0;
            return `${context.label}: ${value} ψήφοι (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Αποτελέσματα</h2>
        <div className="mb-4">
          <p className="text-lg text-gray-700">
            Σύνολο Ψήφων: <span className="font-bold text-blue-600">{totalVotes}</span>
          </p>
        </div>

        {/* Option Breakdown */}
        <div className="space-y-3">
          {sortedOptions.map((option, index) => {
            const voteCount = option.voteCount || 0;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
            
            return (
              <div key={option.id || index} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-grow">
                    <p className="font-medium text-gray-900">
                      {option.optionText || option.displayName || `Επιλογή ${option.id}`}
                    </p>
                    {option.imageUrl && (
                      <img 
                        src={option.imageUrl} 
                        alt={option.optionText || option.displayName} 
                        className="mt-2 h-16 w-16 object-cover rounded"
                      />
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600">{voteCount}</p>
                    <p className="text-sm text-gray-500">{percentage}%</p>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                {/* Auth vs Unauth breakdown if available */}
                {option.authenticatedVotes !== undefined && option.unauthenticatedVotes !== undefined && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>Εγγεγραμμένοι: {option.authenticatedVotes}</span>
                    <span>Ανώνυμοι: {option.unauthenticatedVotes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div style={{ height: '300px' }}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Ranked Choice Results if applicable */}
      {poll?.questionType === 'ranked-choice' && results.rankDistribution && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Κατανομή Κατάταξης</h3>
          <div className="space-y-4">
            {Object.entries(results.rankDistribution).map(([optionId, ranks]) => {
              const option = options.find(opt => opt.id === parseInt(optionId));
              return (
                <div key={optionId}>
                  <p className="font-medium text-gray-900 mb-2">
                    {option?.optionText || option?.displayName || `Επιλογή ${optionId}`}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(ranks).map(([rank, count]) => (
                      <div key={rank} className="text-center p-2 bg-gray-100 rounded">
                        <p className="text-xs text-gray-600">#{rank}</p>
                        <p className="text-sm font-semibold">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
