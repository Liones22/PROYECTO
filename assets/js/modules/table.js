import { formatCurrency, sanitize } from './utils.js';

let dataTable;

function typeBadge(type) {
  return type === 'income'
    ? '<span class="pill-type pill-income">Ingreso</span>'
    : '<span class="pill-type pill-expense">Egreso</span>';
}

function actionButtons(txId) {
  return `
    <div class="d-flex justify-content-center gap-1">
      <button class="btn btn-sm btn-outline-primary js-edit" data-id="${txId}">Editar</button>
      <button class="btn btn-sm btn-outline-danger js-delete" data-id="${txId}">Eliminar</button>
    </div>
  `;
}

export function initTable(selector) {
  dataTable = $(selector).DataTable({
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json'
    },
    pageLength: 8,
    order: [[0, 'desc']],
    columnDefs: [
      { targets: [4], className: 'text-end' },
      { targets: [5], orderable: false }
    ]
  });

  return dataTable;
}

export function redrawTable(transactions, filterType = 'all') {
  if (!dataTable) return;

  const rows = transactions
    .filter((tx) => filterType === 'all' || tx.type === filterType)
    .map((tx) => ([
      sanitize(tx.date),
      sanitize(tx.description),
      sanitize(tx.concept),
      typeBadge(tx.type),
      `<span class="${tx.type === 'income' ? 'amount-income' : 'amount-expense'}">${formatCurrency(tx.amount)}</span>`,
      actionButtons(tx.id)
    ]));

  dataTable.clear();
  dataTable.rows.add(rows).draw();
}
