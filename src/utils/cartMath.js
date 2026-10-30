/** Mirrors backend orders/pricing.py - used only to DISPLAY guest-cart totals. The server recomputes everything at checkout. */
const cents = (n) => Math.round(Number(n) * 100);

export function computeSummary(items, rules) {
  const list = items.reduce((sum, i) => sum + cents(i.list_price) * i.quantity, 0);
  const payable = items.reduce((sum, i) => sum + cents(i.unit_price) * i.quantity, 0);
  const threshold = cents(rules.free_shipping_threshold);
  const flat = cents(rules.shipping_flat_rate);
  const shipping = items.length === 0 || payable >= threshold ? 0 : flat;
  const f = (c) => (c / 100).toFixed(2);
  return {
    subtotal: f(list),
    discount: f(list - payable),
    shipping: f(shipping),
    total: f(payable + shipping),
    free_shipping_threshold: f(threshold),
  };
}
