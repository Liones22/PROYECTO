import { STORAGE_KEY } from './config.js';

const defaultState = {
  transactions: [],
  budget: 0
};

export const state = structuredClone(defaultState);

export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];
    state.budget = Number(parsed.budget) > 0 ? Number(parsed.budget) : 0;
  } catch {
    state.transactions = [];
    state.budget = 0;
  }
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
