// Variables globales para totales y datos de gráficos
let totalIncome = 0;
let totalExpense = 0;
const monthlyIncomes = Array(12).fill(0);
const monthlyExpenses = Array(12).fill(0);

const expensesConcepts = ["Mercado", "Renta", "Vehicular", "Deudas", "Imprevistos", "Otros"];
const incomeConcepts = ["Nomina", "Pasivos", "Otros"];

const expensesByConcept = {
  "Mercado": 0,
  "Renta": 0,
  "Vehicular": 0,
  "Deudas": 0,
  "Imprevistos": 0,
  "Otros": 0
};

const incomesByConcept = {
  "Nomina": 0,
  "Pasivos": 0,
  "Otros": 0
};

// Referencias a elementos del DOM
const totalIncomeDisplay = document.getElementById('totalIncome');
const totalExpenseDisplay = document.getElementById('totalExpense');
const netBalanceDisplay = document.getElementById('netBalance');
const transactionForm = document.getElementById('transactionForm');
const transactionsTableBody = document.querySelector('#transactionsTable tbody');
const typeSelect = document.getElementById('type');
const conceptGroup = document.getElementById('conceptGroup');
const conceptSelect = document.getElementById('concept');
const amountInput = document.getElementById('amount'); // Campo monto

// Variables para gráficos
let expensesPieChart, incomesPieChart, incomesBarChart, expensesBarChart;

/**
 * Función para formatear la cadena ingresada en el campo "Monto"  
 * - Se eliminan "$" y comas.  
 * - Se permiten únicamente dígitos y un punto (si es que se escribe).  
 * - Se insertan separadores de miles en la parte entera.  
 * - Si se detecta un punto, se consideran los dígitos siguientes como decimales (máximo 2).
 * - Se limita la parte entera a 9 dígitos.
 */
function formatAmountInput(value) {
  // Eliminar cualquier carácter que no sea dígito o punto
  value = value.replace(/[^0-9.]/g, '');
  
  // Permitir solo el primer punto en caso de que haya varios
  const firstDotIndex = value.indexOf('.');
  if (firstDotIndex !== -1) {
    // Separamos en parte entera y decimal
    let intPart = value.slice(0, firstDotIndex);
    let decPart = value.slice(firstDotIndex + 1).replace(/\./g, '');
    
    // Limitar parte entera a 9 dígitos
    if (intPart.length > 9) {
      intPart = intPart.slice(0, 9);
    }
    
    // Aplicar separador de miles a la parte entera
    let formattedInt = intPart === '' ? '0' : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Limitar decimales a 2 dígitos
    decPart = decPart.slice(0, 2);
    return "$" + formattedInt + "." + decPart;
  } else {
    // No se ha ingresado punto: se trata toda la cadena como parte entera
    let intPart = value;
    if (intPart.length > 9) {
      intPart = intPart.slice(0, 9);
    }
    let formattedInt = intPart === '' ? '' : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return "$" + formattedInt;
  }
}

// Evento para actualizar las opciones del select "Concepto" según el tipo seleccionado
function updateConceptOptions() {
  const typeValue = typeSelect.value;
  conceptSelect.innerHTML = ""; // Limpiar opciones

  if (typeValue === "income") {
    incomeConcepts.forEach(concept => {
      const option = document.createElement('option');
      option.value = concept;
      option.textContent = concept;
      conceptSelect.appendChild(option);
    });
    conceptGroup.style.display = "block";
  } else if (typeValue === "expense") {
    expensesConcepts.forEach(concept => {
      const option = document.createElement('option');
      option.value = concept;
      option.textContent = concept;
      conceptSelect.appendChild(option);
    });
    conceptGroup.style.display = "block";
  } else {
    conceptGroup.style.display = "none";
  }
}

typeSelect.addEventListener('change', updateConceptOptions);

// Evento para formatear el campo "Monto" en tiempo real
amountInput.addEventListener('input', function(e) {
  // Eliminar "$" y comas para trabajar con el valor bruto
  let rawValue = this.value.replace(/[$,]/g, '');
  // Aplicar el formateo deseado
  let formatted = formatAmountInput(rawValue);
  this.value = formatted;
});

// Evento para el formulario
transactionForm.addEventListener('submit', function(e) {
  e.preventDefault();

  // Obtener valores del formulario
  const dateStr = document.getElementById('date').value;
  const description = document.getElementById('description').value;
  
  // Extraer el número a partir del valor formateado (por ejemplo, "$1,234.56")
  const rawAmountStr = amountInput.value;
  const amount = parseFloat(rawAmountStr.replace(/[^0-9.]/g, ''));
  
  const type = typeSelect.value;
  const concept = conceptSelect.value;

  if (!dateStr || !description || isNaN(amount) || !type || !concept) {
    alert('Por favor, complete todos los campos correctamente.');
    return;
  }

  // Crear objeto transacción
  const transaction = { date: dateStr, description, amount, type, concept };

  // Actualizar totales y datos para gráficos según el tipo
  const transactionDate = new Date(dateStr);
  const monthIndex = transactionDate.getMonth(); // 0: enero, ... 11: diciembre

  if (type === 'income') {
    totalIncome += amount;
    monthlyIncomes[monthIndex] += amount;
    incomesByConcept[concept] += amount;
  } else if (type === 'expense') {
    totalExpense += amount;
    monthlyExpenses[monthIndex] += amount;
    expensesByConcept[concept] += amount;
  }

  // Agregar la transacción a la tabla
  addTransactionToTable(transaction);

  // Actualizar resumen del dashboard y gráficos
  updateSummary();
  updateCharts();

  // Reiniciar formulario
  transactionForm.reset();
  conceptGroup.style.display = "none";
});

// Actualiza el resumen de totales
function updateSummary() {
  totalIncomeDisplay.textContent = formatAmountInput(totalIncome.toString().replace(/[^0-9.]/g, ''));
  totalExpenseDisplay.textContent = formatAmountInput(totalExpense.toString().replace(/[^0-9.]/g, ''));
  const netBalance = totalIncome - totalExpense;
  netBalanceDisplay.textContent = formatAmountInput(netBalance.toString().replace(/[^0-9.]/g, ''));
}

// Agrega una transacción a la tabla
function addTransactionToTable(transaction) {
  const row = document.createElement('tr');

  const cellDate = document.createElement('td');
  cellDate.textContent = transaction.date;
  
  const cellDescription = document.createElement('td');
  cellDescription.textContent = transaction.description;
  
  const cellConcept = document.createElement('td');
  cellConcept.textContent = transaction.concept;
  
  const cellType = document.createElement('td');
  cellType.textContent = transaction.type === 'income' ? 'Ingreso' : 'Gasto';
  
  const cellAmount = document.createElement('td');
  cellAmount.textContent = formatAmountInput(transaction.amount.toString());
  cellAmount.style.color = transaction.type === 'income' ? '#27ae60' : '#c0392b';

  row.appendChild(cellDate);
  row.appendChild(cellDescription);
  row.appendChild(cellConcept);
  row.appendChild(cellType);
  row.appendChild(cellAmount);

  transactionsTableBody.appendChild(row);
}

// Inicializa los gráficos con Chart.js
function initCharts() {
  // Gráfico de pastel para gastos por concepto
  const expensesPieCtx = document.getElementById('expensesPieChart').getContext('2d');
  expensesPieChart = new Chart(expensesPieCtx, {
    type: 'pie',
    data: {
      labels: expensesConcepts,
      datasets: [{
        data: expensesConcepts.map(concept => expensesByConcept[concept]),
        backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#ff9f40', '#4bc0c0']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });

  // Gráfico de pastel para ingresos por concepto
  const incomesPieCtx = document.getElementById('incomesPieChart').getContext('2d');
  incomesPieChart = new Chart(incomesPieCtx, {
    type: 'pie',
    data: {
      labels: incomeConcepts,
      datasets: [{
        data: incomeConcepts.map(concept => incomesByConcept[concept]),
        backgroundColor: ['#4bc0c0', '#ffcd56', '#36a2eb']
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });

  // Gráfico de barras para ingresos mensuales
  const incomesBarCtx = document.getElementById('incomesBarChart').getContext('2d');
  incomesBarChart = new Chart(incomesBarCtx, {
    type: 'bar',
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
      datasets: [{
        label: 'Ingresos',
        data: monthlyIncomes,
        backgroundColor: '#36a2eb'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Gráfico de barras para gastos mensuales
  const expensesBarCtx = document.getElementById('expensesBarChart').getContext('2d');
  expensesBarChart = new Chart(expensesBarCtx, {
    type: 'bar',
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
      datasets: [{
        label: 'Gastos',
        data: monthlyExpenses,
        backgroundColor: '#ff6384'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Actualiza los datos de los gráficos
function updateCharts() {
  // Actualizar gráfico de pastel de gastos
  expensesPieChart.data.datasets[0].data = expensesConcepts.map(concept => expensesByConcept[concept]);
  expensesPieChart.update();

  // Actualizar gráfico de pastel de ingresos
  incomesPieChart.data.datasets[0].data = incomeConcepts.map(concept => incomesByConcept[concept]);
  incomesPieChart.update();

  // Actualizar gráfico de barras de ingresos mensuales
  incomesBarChart.data.datasets[0].data = monthlyIncomes;
  incomesBarChart.update();

  // Actualizar gráfico de barras de gastos mensuales
  expensesBarChart.data.datasets[0].data = monthlyExpenses;
  expensesBarChart.update();
}

// Inicializar los gráficos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initCharts);
