/**
 * Mirrors the server's delivery rule for DISPLAY only. The server always recalculates
 * the real subtotal, delivery and total when the order is placed.
 */
export function calcDelivery(subtotal, settings) {
  if (!settings) return { deliveryCharge: 0, remainingForFree: 0, isFree: false, ready: false };
  const isFree = subtotal >= settings.freeDeliveryThreshold;
  return {
    ready: true,
    isFree,
    deliveryCharge: isFree ? 0 : settings.deliveryCharge,
    remainingForFree: isFree ? 0 : settings.freeDeliveryThreshold - subtotal,
  };
}
