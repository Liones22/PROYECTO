import { CONCEPTS } from './config.js';
import { formatCurrency, formatPercent } from './utils.js';

export function fillConceptOptions(selectEl, type, selected = '') {
  const concepts = CONCEPTS[type] || [];
  selectEl.innerHTML = concepts
    .map((concept) => `<option value="${concept}" ${concept === selected ? 'selected' : ''}>${concept}</option>`)
    .join('');
}

export function renderKpis(mountEl, templateHtml, metrics) {
  const cards = [
    { title: 'Ingresos', value: formatCurrency(metrics.income), hint: 'Total acumulado', className: 'kpi-income' },
    { title: 'Egresos', value: formatCurrency(metrics.expense), hint: 'Total acumulado', className: 'kpi-expense' },
    { title: 'Balance', value: formatCurrency(metrics.balance), hint: metrics.balance >= 0 ? 'Positivo' : 'Negativo', className: 'kpi-balance' },
    { title: 'Ahorro', value: formatPercent(metrics.savingsRate), hint: 'Tasa actual', className: 'kpi-savings' }
  ];

  mountEl.innerHTML = cards
    .map((card) => templateHtml
      .replace('{{title}}', card.title)
      .replace('{{value}}', card.value)
      .replace('{{hint}}', card.hint)
      .replace('{{className}}', card.className))
    .join('');
}

export function paintBudget(labelEl, progressEl, budget, expense) {
  if (!budget) {
    labelEl.textContent = 'Sin presupuesto configurado.';
    progressEl.style.width = '0%';
    progressEl.className = 'progress-bar';
    return;
  }

  const used = Math.min((expense / budget) * 100, 100);
  progressEl.style.width = `${used.toFixed(0)}%`;

  if (used < 70) {
    progressEl.className = 'progress-bar bg-success';
  } else if (used <= 100) {
    progressEl.className = 'progress-bar bg-warning';
  } else {
    progressEl.className = 'progress-bar bg-danger';
  }

  const overflow = expense > budget ? ` (excedido por ${formatCurrency(expense - budget)})` : '';
  labelEl.textContent = `${formatCurrency(expense)} gastados de ${formatCurrency(budget)} (${used.toFixed(1)}%)${overflow}`;
}
