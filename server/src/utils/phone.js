/**
 * Pakistani phone numbers. Accepts 03XXXXXXXXX, 03XX-XXXXXXX, +92 3XX XXXXXXX,
 * 0092..., 92... and landlines with an area code (e.g. 042-35761234).
 * Returns the normalised local form (03XXXXXXXXX) or null.
 */
export function normalizePkPhone(input) {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('0092')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('92') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (/^03\d{9}$/.test(digits)) return digits; // mobile
  if (/^0[1-9]\d{8,9}$/.test(digits)) return digits; // landline with area code
  return null;
}
