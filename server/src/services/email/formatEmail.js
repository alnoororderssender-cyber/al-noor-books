import { formatRs } from '../../utils/money.js';

/** Escape anything customer-controlled before it goes into HTML. */
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paymentLabel = (order) => (order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment');
const deliveryLabel = (order) => (order.pricing.deliveryCharge === 0 ? 'FREE' : formatRs(order.pricing.deliveryCharge));
const itemLabel = (i) => (i.selectedType ? `${i.productNameSnapshot} (${i.selectedType})` : i.productNameSnapshot);

export function buildSubject(order) {
  const pay = order.payment.method === 'cod' ? 'COD' : 'Online';
  return `New order #${order.orderId} — ${formatRs(order.pricing.total)} (${pay})`;
}

/** HTML body. Table layout + inline styles so it renders in Gmail/Outlook/mobile. */
export function buildHtml(order) {
  const c = order.customer;
  const row = (label, value) =>
    `<tr><td style="padding:6px 0;color:#6b7280;width:130px;vertical-align:top">${label}</td><td style="padding:6px 0;color:#111827;font-weight:600">${value}</td></tr>`;

  const itemRows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#111827">${esc(itemLabel(i))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#111827">${esc(i.quantity)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;white-space:nowrap">${esc(formatRs(i.unitPrice))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;white-space:nowrap">${esc(formatRs(i.subtotal))}</td>
      </tr>`,
    )
    .join('');

  const totalRow = (label, value, strong = false) =>
    `<tr><td colspan="3" style="padding:6px 8px;text-align:right;color:${strong ? '#0B1F3A' : '#6b7280'};${strong ? 'font-weight:700;font-size:16px;' : ''}">${label}</td><td style="padding:6px 8px;text-align:right;white-space:nowrap;color:#0B1F3A;font-weight:${strong ? 700 : 600};${strong ? 'font-size:16px;' : ''}">${value}</td></tr>`;

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:8px;overflow:hidden">
  <tr><td style="background:#0B1F3A;padding:20px 24px;color:#ffffff">
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8">Al Noor Books</div>
    <div style="font-size:22px;font-weight:700;margin-top:4px">New order #${esc(order.orderId)}</div>
  </td></tr>
  <tr><td style="padding:20px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">
      ${row('Customer', esc(c.name))}
      ${row('Phone', esc(c.phone))}
      ${row('Delivery address', `${esc(c.address)}<br>${esc(c.cityArea)}`)}
      ${row('Payment method', esc(paymentLabel(order)))}
      ${order.payment.method === 'online' ? row('Payment proof', 'Screenshot available in the admin order record') : ''}
      ${c.note ? row('Customer note', esc(c.note)) : ''}
    </table>
  </td></tr>
  <tr><td style="padding:0 16px 8px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse">
      <tr style="background:#f9fafb">
        <th align="left" style="padding:10px 8px;color:#6b7280;font-size:12px;text-transform:uppercase">Product</th>
        <th style="padding:10px 8px;color:#6b7280;font-size:12px;text-transform:uppercase">Qty</th>
        <th align="right" style="padding:10px 8px;color:#6b7280;font-size:12px;text-transform:uppercase">Price</th>
        <th align="right" style="padding:10px 8px;color:#6b7280;font-size:12px;text-transform:uppercase">Amount</th>
      </tr>
      ${itemRows}
      ${totalRow('Subtotal', esc(formatRs(order.pricing.subtotal)))}
      ${totalRow('Delivery charges', esc(deliveryLabel(order)))}
      ${totalRow('Total', esc(formatRs(order.pricing.total)), true)}
    </table>
  </td></tr>
  <tr><td style="padding:16px 24px 24px;color:#9ca3af;font-size:12px">Automatic notification from your Al Noor Books store.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Plain-text fallback (also used for the dev console preview). */
export function buildText(order) {
  const c = order.customer;
  const lines = [
    `NEW ORDER #${order.orderId}`,
    '',
    `Customer: ${c.name}`,
    `Phone: ${c.phone}`,
    `Delivery address: ${c.address}, ${c.cityArea}`,
    `Payment method: ${paymentLabel(order)}`,
  ];
  if (c.note) lines.push(`Customer note: ${c.note}`);
  lines.push('', 'Items:');
  for (const i of order.items) {
    lines.push(`- ${itemLabel(i)} | Qty ${i.quantity} x ${formatRs(i.unitPrice)} = ${formatRs(i.subtotal)}`);
  }
  lines.push(
    '',
    `Subtotal: ${formatRs(order.pricing.subtotal)}`,
    `Delivery charges: ${deliveryLabel(order)}`,
    `TOTAL: ${formatRs(order.pricing.total)}`,
  );
  return lines.join('\n');
}
