import { CONCEPTS } from './modules/config.js';
import { loadState, saveState, state } from './modules/store.js';
import { calculateMetrics } from './modules/metrics.js';
import { makeId } from './modules/utils.js';
import { loadTemplate } from './modules/templates.js';
import { initTable, redrawTable } from './modules/table.js';
import { initCharts, updateCharts } from './modules/charts.js';
import { fillConceptOptions, paintBudget, renderKpis } from './modules/ui.js';

const dom = {
  form: document.getElementById('transactionForm'),
  txDate: document.getElementById('txDate'),
  txDescription: document.getElementById('txDescription'),
  txAmount: document.getElementById('txAmount'),
  txType: document.getElementById('txType'),
  txConcept: document.getElementById('txConcept'),
  budgetInput: document.getElementById('budgetInput'),
  saveBudgetBtn: document.getElementById('saveBudgetBtn'),
  budgetLabel: document.getElementById('budgetLabel'),
  budgetProgress: document.getElementById('budgetProgress'),
  kpiMount: document.getElementById('kpiMount'),
  filter: document.getElementById('quickFilter'),
  clearBtn: document.getElementById('clearBtn'),
  seedBtn: document.getElementById('seedBtn'),
  exportBtn: document.getElementById('exportBtn'),
  editForm: document.getElementById('editForm'),
  editMount: document.getElementById('editTemplateMount')
};

let kpiTemplate = '';
let editTemplate = '';
let editModal;

function resetForm() {
  dom.form.reset();
  dom.txDate.value = new Date().toISOString().slice(0, 10);
  fillConceptOptions(dom.txConcept, 'income');
}

function refresh() {
  const metrics = calculateMetrics(state.transactions);
  renderKpis(dom.kpiMount, kpiTemplate, metrics);
  redrawTable(state.transactions, dom.filter.value);
  updateCharts(metrics);
  paintBudget(dom.budgetLabel, dom.budgetProgress, state.budget, metrics.expense);
  saveState();
}

function addTransaction(event) {
  event.preventDefault();

  if (!dom.form.checkValidity()) {
    dom.form.reportValidity();
    return;
  }

  const amount = Number(dom.txAmount.value);
  if (amount <= 0) {
    alert('El monto debe ser mayor a 0.');
    return;
  }

  state.transactions.push({
    id: makeId(),
    date: dom.txDate.value,
    description: dom.txDescription.value.trim(),
    amount,
    type: dom.txType.value,
    concept: dom.txConcept.value
  });

  resetForm();
  refresh();
}

function removeTransaction(id) {
  state.transactions = state.transactions.filter((tx) => tx.id !== id);
  refresh();
}

function openEditModal(id) {
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) return;

  dom.editMount.innerHTML = editTemplate;
  const modalType = dom.editMount.querySelector('#editType');
  const modalConcept = dom.editMount.querySelector('#editConcept');

  dom.editMount.querySelector('#editId').value = tx.id;
  dom.editMount.querySelector('#editDate').value = tx.date;
  dom.editMount.querySelector('#editDescription').value = tx.description;
  dom.editMount.querySelector('#editAmount').value = tx.amount;
  modalType.value = tx.type;
  fillConceptOptions(modalConcept, tx.type, tx.concept);

  modalType.addEventListener('change', () => fillConceptOptions(modalConcept, modalType.value));
  editModal.show();
}

function saveEditedTransaction(event) {
  event.preventDefault();

  const id = dom.editMount.querySelector('#editId').value;
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) return;

  const date = dom.editMount.querySelector('#editDate').value;
  const description = dom.editMount.querySelector('#editDescription').value.trim();
  const type = dom.editMount.querySelector('#editType').value;
  const concept = dom.editMount.querySelector('#editConcept').value;
  const amount = Number(dom.editMount.querySelector('#editAmount').value);

  if (!date || !description || !type || !concept || amount <= 0) {
    alert('Completa correctamente el formulario de edición.');
    return;
  }

  tx.date = date;
  tx.description = description;
  tx.type = type;
  tx.concept = concept;
  tx.amount = amount;

  editModal.hide();
  refresh();
}

function exportCSV() {
  if (!state.transactions.length) {
    alert('No hay transacciones para exportar.');
    return;
  }

  const header = ['fecha', 'descripcion', 'concepto', 'tipo', 'monto'];
  const rows = state.transactions.map((tx) => [tx.date, tx.description, tx.concept, tx.type, tx.amount.toFixed(2)]);
  const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transacciones-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function setBudget() {
  const value = Number(dom.budgetInput.value);
  if (value <= 0) {
    alert('Ingresa un presupuesto válido mayor a 0.');
    return;
  }

  state.budget = value;
  dom.budgetInput.value = '';
  refresh();
}

function seedData() {
  state.transactions = [
    { id: makeId(), date: '2026-01-03', description: 'Nómina enero', amount: 1800, type: 'income', concept: 'Nómina' },
    { id: makeId(), date: '2026-01-05', description: 'Pago de renta', amount: 650, type: 'expense', concept: 'Renta' },
    { id: makeId(), date: '2026-01-06', description: 'Mercado semanal', amount: 210, type: 'expense', concept: 'Mercado' },
    { id: makeId(), date: '2026-01-15', description: 'Proyecto freelance', amount: 420, type: 'income', concept: 'Freelance' },
    { id: makeId(), date: '2026-02-02', description: 'Pago de servicios', amount: 130, type: 'expense', concept: 'Servicios' }
  ];
  state.budget = 1800;
  refresh();
}

function clearData() {
  if (!confirm('¿Deseas eliminar todos los registros y reiniciar el dashboard?')) return;
  state.transactions = [];
  state.budget = 0;
  refresh();
}

function bindEvents() {
  dom.txType.addEventListener('change', () => fillConceptOptions(dom.txConcept, dom.txType.value || 'income'));
  dom.form.addEventListener('submit', addTransaction);
  dom.saveBudgetBtn.addEventListener('click', setBudget);
  dom.seedBtn.addEventListener('click', seedData);
  dom.clearBtn.addEventListener('click', clearData);
  dom.exportBtn.addEventListener('click', exportCSV);
  dom.filter.addEventListener('change', refresh);
  dom.editForm.addEventListener('submit', saveEditedTransaction);

  document.querySelector('#transactionsTable tbody').addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const txId = target.dataset.id;
    if (!txId) return;

    if (target.classList.contains('js-delete')) {
      removeTransaction(txId);
    }

    if (target.classList.contains('js-edit')) {
      openEditModal(txId);
    }
  });
}

async function init() {
  kpiTemplate = await loadTemplate('templates/kpis.html', 'kpi-template');
  editTemplate = await loadTemplate('templates/edit-form.html', 'edit-form-template');

  editModal = new bootstrap.Modal('#editModal');

  loadState();
  fillConceptOptions(dom.txConcept, 'income');
  resetForm();

  initTable('#transactionsTable');
  initCharts();
  bindEvents();
  refresh();
}

init().catch((error) => {
  console.error('Error al inicializar dashboard:', error);
  alert('Ocurrió un problema al inicializar la aplicación. Revisa la consola.');
});
