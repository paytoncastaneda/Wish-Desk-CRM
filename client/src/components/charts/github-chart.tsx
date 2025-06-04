import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface GitHubChartProps {
  data?: {
    labels: string[];
    values: number[];
  };
}

export function GitHubChart({ data }: GitHubChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const defaultData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [23, 45, 56, 78]
  };

  const chartData = data || defaultData;

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Commits',
          data: chartData.values,
          backgroundColor: 'hsl(122, 39%, 49%)', // Success color
          borderColor: 'hsl(122, 39%, 49%)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'hsl(214, 32%, 91%)'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <div className="h-64">
      <canvas ref={chartRef} />
    </div>
  );
}
