/** Single source of truth for delivery logic on the server. */
export function calculateDelivery(subtotal, settings) {
  return subtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryCharge;
}

export function calculateTotals(subtotal, settings) {
  const deliveryCharge = calculateDelivery(subtotal, settings);
  return { subtotal, deliveryCharge, total: subtotal + deliveryCharge };
}
