import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const AllocationChart = ({ suggestions }) => {
  const safeSuggestions = suggestions && suggestions.length > 0 ? suggestions : [];
  
  const data = {
    labels: safeSuggestions.map(s => s.asset_name || s.assetName || 'Unknown'),
    datasets: [
      {
        data: safeSuggestions.length > 0 ? safeSuggestions.map(() => 25) : [100],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // primary blue
          'rgba(16, 185, 129, 0.8)', // emerald
          'rgba(245, 158, 11, 0.8)', // amber
          'rgba(139, 92, 246, 0.8)', // violet
          'rgba(236, 72, 153, 0.8)', // pink
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#4B5563', // neu-muted
          font: {
            family: 'DM Sans',
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return ` ${context.label}: ${context.raw}%`;
          }
        }
      }
    },
  };

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center h-full">
      <h3 className="text-lg font-jakarta font-bold text-neu-primary mb-6 self-start">Portfolio Allocation</h3>
      <div className="w-full max-w-[250px] aspect-square">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default AllocationChart;
