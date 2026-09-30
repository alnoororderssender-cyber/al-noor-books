export const formatPrice = (n) => `Rs. ${Number(n || 0).toLocaleString('en-US')}`;

export function formatDate(value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(value).toLocaleDateString('en-GB', opts);
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
