import React from 'react';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler);

function ComplexityGraph({ complexity, darkMode }) {
  const nValues = [0, 10, 20, 30, 40, 50];
  const getValues = (comp) => {
    if (!comp) return nValues.map(() => 0);
    if (comp.includes("O(1)")) return nValues.map(() => 5);
    if (comp.includes("log")) return nValues.map(n => Math.log2(n + 1) * 5);
    if (comp.includes("n^2")) return nValues.map(n => (n * n) / 10);
    if (comp.includes("n")) return nValues.map(n => n);
    return nValues.map(n => n);
  };

  const data = {
    labels: nValues,
    datasets: [{
      label: 'Trend',
      data: getValues(complexity),
      borderColor: '#2cccc3',
      backgroundColor: 'rgba(44, 204, 195, 0.2)',
      borderWidth: 2,
      pointBackgroundColor: darkMode ? '#000' : '#fff',
      fill: true,
      tension: 0.4
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        grid: { color: darkMode ? '#333' : '#e5e7eb' },
        ticks: { color: darkMode ? '#888' : '#64748b' }
      },
      y: { display: false }
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg-input)", padding: "15px", borderRadius: "6px", height: "220px", border: "1px solid var(--border)" }}>
      <h4 style={{ margin: "0 0 15px 0", color: "var(--text-dim)", fontSize: "0.75rem" }}>VISUALIZATION</h4>
      <div style={{ height: "160px" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default ComplexityGraph;