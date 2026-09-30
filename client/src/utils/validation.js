/** Accepts 03XXXXXXXXX, 03XX-XXXXXXX, +92 3XX XXXXXXX, 0092..., 92... and landlines with area code. */
export function normalizePkPhone(input) {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('0092')) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith('92') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (/^03\d{9}$/.test(digits)) return digits;
  if (/^0[1-9]\d{8,9}$/.test(digits)) return digits;
  return null;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Returns an error message, or '' if the file is acceptable. */
export function validateImageFile(file) {
  if (!file) return 'Choose an image.';
  if (!IMAGE_TYPES.includes(file.type)) return 'Please use a JPG, PNG or WebP image.';
  if (file.size > MAX_IMAGE_BYTES) return 'That image is larger than 5 MB.';
  return '';
}
