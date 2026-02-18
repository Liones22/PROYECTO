import { CONCEPTS } from './config.js';

export function calculateMetrics(transactions) {
  const monthlyIncome = Array(12).fill(0);
  const monthlyExpense = Array(12).fill(0);

  const expensesByConcept = Object.fromEntries(CONCEPTS.expense.map((c) => [c, 0]));
  const incomesByConcept = Object.fromEntries(CONCEPTS.income.map((c) => [c, 0]));

  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    const month = new Date(tx.date).getMonth();
    if (tx.type === 'income') {
      income += tx.amount;
      monthlyIncome[month] += tx.amount;
      if (incomesByConcept[tx.concept] !== undefined) incomesByConcept[tx.concept] += tx.amount;
    } else {
      expense += tx.amount;
      monthlyExpense[month] += tx.amount;
      if (expensesByConcept[tx.concept] !== undefined) expensesByConcept[tx.concept] += tx.amount;
    }
  });

  const balance = income - expense;
  const savingsRate = income ? (balance / income) * 100 : 0;

  return {
    income,
    expense,
    balance,
    savingsRate,
    monthlyIncome,
    monthlyExpense,
    expensesByConcept,
    incomesByConcept
  };
}
