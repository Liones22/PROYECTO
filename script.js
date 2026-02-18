const STORAGE_KEY = "finance-dashboard-state-v2";

const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const expensesConcepts = ["Mercado", "Renta", "Vehicular", "Deudas", "Imprevistos", "Salud", "Ocio", "Otros"];
const incomeConcepts = ["Nómina", "Freelance", "Inversiones", "Ventas", "Otros"];

const dom = {
  totalIncome: document.getElementById("totalIncome"),
  totalExpense: document.getElementById("totalExpense"),
  netBalance: document.getElementById("netBalance"),
  savingsRate: document.getElementById("savingsRate"),
  form: document.getElementById("transactionForm"),
  date: document.getElementById("date"),
  description: document.getElementById("description"),
  amount: document.getElementById("amount"),
  type: document.getElementById("type"),
  concept: document.getElementById("concept"),
  conceptGroup: document.getElementById("conceptGroup"),
  transactionsBody: document.querySelector("#transactionsTable tbody"),
  emptyState: document.getElementById("emptyState"),
  searchInput: document.getElementById("searchInput"),
  filterType: document.getElementById("filterType"),
  budgetInput: document.getElementById("budgetInput"),
  budgetStatus: document.getElementById("budgetStatus"),
  saveBudgetBtn: document.getElementById("saveBudgetBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  clearDataBtn: document.getElementById("clearDataBtn"),
  seedDataBtn: document.getElementById("seedDataBtn")
};

const appState = {
  transactions: [],
  budget: null
};

const charts = {};

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(value || 0);
}

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function normalizeAmountInput(value) {
  const raw = value.replace(/[^\d.]/g, "");
  if (!raw) {
    return "";
  }
  const number = Number(raw);
  if (Number.isNaN(number)) {
    return "";
  }
  return formatCurrency(number).replace("US", "");
}

function parseAmount(formatted) {
  return Number((formatted || "").replace(/[^\d.]/g, ""));
}

function getConceptListByType(type) {
  return type === "income" ? incomeConcepts : type === "expense" ? expensesConcepts : [];
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const saved = JSON.parse(raw);
    appState.transactions = Array.isArray(saved.transactions) ? saved.transactions : [];
    appState.budget = typeof saved.budget === "number" ? saved.budget : null;
  } catch {
    appState.transactions = [];
    appState.budget = null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function updateConceptOptions() {
  const type = dom.type.value;
  const concepts = getConceptListByType(type);
  dom.concept.innerHTML = "";

  if (!concepts.length) {
    dom.conceptGroup.hidden = true;
    return;
  }

  concepts.forEach((concept) => {
    const option = document.createElement("option");
    option.value = concept;
    option.textContent = concept;
    dom.concept.appendChild(option);
  });

  dom.conceptGroup.hidden = false;
}

function getFilteredTransactions() {
  const query = dom.searchInput.value.trim().toLowerCase();
  const typeFilter = dom.filterType.value;

  return appState.transactions.filter((tx) => {
    const matchesType = typeFilter === "all" || tx.type === typeFilter;
    const matchesQuery = !query || tx.description.toLowerCase().includes(query) || tx.concept.toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });
}

function renderTransactions() {
  const rows = getFilteredTransactions();
  dom.transactionsBody.innerHTML = "";

  rows.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((tx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.description}</td>
      <td>${tx.concept}</td>
      <td><span class="type-pill ${tx.type === "income" ? "type-income" : "type-expense"}">${tx.type === "income" ? "Ingreso" : "Egreso"}</span></td>
      <td style="color:${tx.type === "income" ? "#118a62" : "#b43d3d"}">${formatCurrency(tx.amount)}</td>
      <td><button class="row-delete" type="button" data-id="${tx.id}" aria-label="Eliminar transacción">Eliminar</button></td>
    `;
    dom.transactionsBody.appendChild(row);
  });

  dom.emptyState.hidden = rows.length > 0;
}

function computeAggregates() {
  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);
  const incomesByConcept = Object.fromEntries(incomeConcepts.map((item) => [item, 0]));
  const expensesByConcept = Object.fromEntries(expensesConcepts.map((item) => [item, 0]));

  let totalIncome = 0;
  let totalExpense = 0;

  appState.transactions.forEach((tx) => {
    const monthIndex = new Date(tx.date).getMonth();
    if (tx.type === "income") {
      totalIncome += tx.amount;
      monthlyIncome[monthIndex] += tx.amount;
      if (tx.concept in incomesByConcept) {
        incomesByConcept[tx.concept] += tx.amount;
      }
    } else {
      totalExpense += tx.amount;
      monthlyExpense[monthIndex] += tx.amount;
      if (tx.concept in expensesByConcept) {
        expensesByConcept[tx.concept] += tx.amount;
      }
    }
  });

  return { totalIncome, totalExpense, monthlyIncome, monthlyExpense, incomesByConcept, expensesByConcept };
}

function updateSummary() {
  const { totalIncome, totalExpense } = computeAggregates();
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome ? ((balance / totalIncome) * 100) : 0;

  dom.totalIncome.textContent = formatCurrency(totalIncome);
  dom.totalExpense.textContent = formatCurrency(totalExpense);
  dom.netBalance.textContent = formatCurrency(balance);
  dom.savingsRate.textContent = formatPercent(savingsRate);

  updateBudgetStatus(totalExpense);
}

function updateBudgetStatus(totalExpense) {
  if (!appState.budget) {
    dom.budgetStatus.textContent = "Aún no tienes presupuesto configurado.";
    return;
  }

  const percentUsed = (totalExpense / appState.budget) * 100;
  if (percentUsed < 75) {
    dom.budgetStatus.textContent = `Vas bien: llevas ${formatPercent(percentUsed)} de tu presupuesto (${formatCurrency(totalExpense)} de ${formatCurrency(appState.budget)}).`;
  } else if (percentUsed <= 100) {
    dom.budgetStatus.textContent = `Atención: ya usaste ${formatPercent(percentUsed)} del presupuesto.`;
  } else {
    dom.budgetStatus.textContent = `⚠️ Superaste el presupuesto por ${formatCurrency(totalExpense - appState.budget)}.`;
  }
}

function initCharts() {
  charts.expensesPie = new Chart(document.getElementById("expensesPieChart"), {
    type: "doughnut",
    data: { labels: expensesConcepts, datasets: [{ data: Array(expensesConcepts.length).fill(0), backgroundColor: ["#ff6384", "#36a2eb", "#9966ff", "#ffcd56", "#26c6da", "#f06292", "#66bb6a", "#8d6e63"] }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  charts.incomesPie = new Chart(document.getElementById("incomesPieChart"), {
    type: "doughnut",
    data: { labels: incomeConcepts, datasets: [{ data: Array(incomeConcepts.length).fill(0), backgroundColor: ["#4bc0c0", "#36a2eb", "#ffcd56", "#9966ff", "#66bb6a"] }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  charts.cashflowLine = new Chart(document.getElementById("cashflowLineChart"), {
    type: "line",
    data: { labels: monthLabels, datasets: [{ label: "Balance mensual", data: Array(12).fill(0), borderColor: "#2d5bd1", tension: 0.25, fill: true, backgroundColor: "rgba(45, 91, 209, 0.15)" }] },
    options: { scales: { y: { beginAtZero: true } } }
  });

  charts.comparisonBar = new Chart(document.getElementById("comparisonBarChart"), {
    type: "bar",
    data: {
      labels: monthLabels,
      datasets: [
        { label: "Ingresos", data: Array(12).fill(0), backgroundColor: "#24b485" },
        { label: "Egresos", data: Array(12).fill(0), backgroundColor: "#ea5b5b" }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

function updateCharts() {
  const { monthlyIncome, monthlyExpense, incomesByConcept, expensesByConcept } = computeAggregates();

  charts.expensesPie.data.datasets[0].data = expensesConcepts.map((item) => expensesByConcept[item]);
  charts.incomesPie.data.datasets[0].data = incomeConcepts.map((item) => incomesByConcept[item]);
  charts.cashflowLine.data.datasets[0].data = monthlyIncome.map((income, index) => income - monthlyExpense[index]);
  charts.comparisonBar.data.datasets[0].data = monthlyIncome;
  charts.comparisonBar.data.datasets[1].data = monthlyExpense;

  Object.values(charts).forEach((chart) => chart.update());
}

function rerender() {
  renderTransactions();
  updateSummary();
  updateCharts();
  saveState();
}

function addTransaction(event) {
  event.preventDefault();

  const amount = parseAmount(dom.amount.value);
  const tx = {
    id: crypto.randomUUID(),
    date: dom.date.value,
    description: dom.description.value.trim(),
    amount,
    type: dom.type.value,
    concept: dom.concept.value
  };

  if (!tx.date || !tx.description || !tx.amount || !tx.type || !tx.concept) {
    alert("Completa todos los campos correctamente.");
    return;
  }

  appState.transactions.push(tx);
  dom.form.reset();
  dom.conceptGroup.hidden = true;
  rerender();
}

function removeTransaction(id) {
  appState.transactions = appState.transactions.filter((tx) => tx.id !== id);
  rerender();
}

function exportToCSV() {
  if (!appState.transactions.length) {
    alert("No hay datos para exportar.");
    return;
  }

  const header = ["fecha", "descripcion", "concepto", "tipo", "monto"];
  const rows = appState.transactions.map((tx) => [tx.date, tx.description, tx.concept, tx.type, tx.amount.toFixed(2)]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `transacciones-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function saveBudget() {
  const budget = Number(dom.budgetInput.value);
  if (!budget || budget < 0) {
    alert("Ingresa un presupuesto válido.");
    return;
  }
  appState.budget = budget;
  dom.budgetInput.value = "";
  rerender();
}

function clearData() {
  if (!confirm("¿Seguro que deseas eliminar todas las transacciones y el presupuesto?")) {
    return;
  }
  appState.transactions = [];
  appState.budget = null;
  rerender();
}

function seedDemoData() {
  if (appState.transactions.length > 0 && !confirm("Ya hay datos. ¿Deseas reemplazarlos por un ejemplo?")) {
    return;
  }

  appState.transactions = [
    { id: crypto.randomUUID(), date: "2026-01-05", description: "Nómina Enero", amount: 1800, type: "income", concept: "Nómina" },
    { id: crypto.randomUUID(), date: "2026-01-09", description: "Mercado quincenal", amount: 260, type: "expense", concept: "Mercado" },
    { id: crypto.randomUUID(), date: "2026-01-12", description: "Renta departamento", amount: 620, type: "expense", concept: "Renta" },
    { id: crypto.randomUUID(), date: "2026-02-01", description: "Pago cliente", amount: 510, type: "income", concept: "Freelance" },
    { id: crypto.randomUUID(), date: "2026-02-07", description: "Combustible", amount: 85, type: "expense", concept: "Vehicular" }
  ];
  appState.budget = 1400;
  rerender();
}

function bindEvents() {
  dom.type.addEventListener("change", updateConceptOptions);
  dom.amount.addEventListener("input", () => {
    const formatted = normalizeAmountInput(dom.amount.value);
    if (formatted) {
      dom.amount.value = formatted;
    }
  });
  dom.form.addEventListener("submit", addTransaction);

  dom.transactionsBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(".row-delete")) return;
    removeTransaction(target.dataset.id);
  });

  [dom.searchInput, dom.filterType].forEach((input) => input.addEventListener("input", renderTransactions));
  dom.exportCsvBtn.addEventListener("click", exportToCSV);
  dom.saveBudgetBtn.addEventListener("click", saveBudget);
  dom.clearDataBtn.addEventListener("click", clearData);
  dom.seedDataBtn.addEventListener("click", seedDemoData);
}

function init() {
  loadState();
  initCharts();
  bindEvents();
  dom.date.value = new Date().toISOString().slice(0, 10);
  rerender();
}

document.addEventListener("DOMContentLoaded", init);
