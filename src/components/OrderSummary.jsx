import { formatPrice } from "../utils/format";

export default function OrderSummary({ summary, children, title = "Order summary", showFreeShipHint = true }) {
  const payableBeforeShipping = Number(summary.total) - Number(summary.shipping);
  const remaining = Number(summary.free_shipping_threshold) - payableBeforeShipping;
  return (
    <aside className="card summary">
      <h2 style={{ fontSize: "var(--fs-lg)" }}>{title}</h2>
      {showFreeShipHint && payableBeforeShipping > 0 && (
        <div className="free-ship">
          {remaining > 0 ? `Add ${formatPrice(remaining)} more for free shipping.` : "You've unlocked free shipping!"}
        </div>
      )}
      <dl>
        <div className="summary__row"><dt>Subtotal</dt><dd>{formatPrice(summary.subtotal)}</dd></div>
        {Number(summary.discount) > 0 && (
          <div className="summary__row summary__row--discount"><dt>Discount</dt><dd>-{formatPrice(summary.discount)}</dd></div>
        )}
        <div className="summary__row"><dt>Shipping</dt><dd>{Number(summary.shipping) === 0 ? "Free" : formatPrice(summary.shipping)}</dd></div>
        <div className="summary__row summary__row--total"><dt>Total</dt><dd>{formatPrice(summary.total)}</dd></div>
      </dl>
      {children}
    </aside>
  );
}
