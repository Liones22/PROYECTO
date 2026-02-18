import { MONTHS } from './config.js';

const charts = {};

export function initCharts() {
  charts.concept = new Chart(document.getElementById('conceptChart'), {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: ['#3a7afe', '#4fbf7f', '#f4b740', '#e15a5a', '#865cf8', '#35a7c9', '#ff7e67', '#7aa3ff'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });

  charts.trend = new Chart(document.getElementById('trendChart'), {
    type: 'bar',
    data: {
      labels: MONTHS,
      datasets: [
        { label: 'Ingresos', data: Array(12).fill(0), backgroundColor: '#28b681' },
        { label: 'Egresos', data: Array(12).fill(0), backgroundColor: '#e15d5d' }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

export function updateCharts(metrics) {
  if (!charts.concept || !charts.trend) return;

  const combined = Object.entries({ ...metrics.expensesByConcept, ...metrics.incomesByConcept })
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  charts.concept.data.labels = combined.map(([label]) => label);
  charts.concept.data.datasets[0].data = combined.map(([, value]) => value);

  charts.trend.data.datasets[0].data = metrics.monthlyIncome;
  charts.trend.data.datasets[1].data = metrics.monthlyExpense;

  charts.concept.update();
  charts.trend.update();
}
