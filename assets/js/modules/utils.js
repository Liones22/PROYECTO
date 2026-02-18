export const formatCurrency = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
}).format(value || 0);

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const makeId = () => crypto.randomUUID();

export const sanitize = (text = '') => String(text)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
