import ImageWithFallback from "./ImageWithFallback";
import { formatDate, formatPrice } from "../utils/format";

export function StatusBadge({ status, label }) {
  return <span className={`badge badge--status-${status}`}>{label}</span>;
}

/** Shared by the confirmation page and the order-detail page. */
export default function OrderDetailView({ order }) {
  return (
    <>
      <section className="card" style={{ marginBottom: "var(--space-5)" }}>
        <dl className="kv" style={{ margin: 0 }}>
          <div><dt>Order number</dt><dd>{order.order_number}</dd></div>
          <div><dt>Placed on</dt><dd>{formatDate(order.created_at)}</dd></div>
          <div><dt>Order status</dt><dd><StatusBadge status={order.status} label={order.status_display} /></dd></div>
          <div><dt>Payment</dt><dd>{order.payment_method_display}</dd></div>
          <div><dt>Payment status</dt><dd>{order.payment_status_display}</dd></div>
          <div><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </section>

      <div className="split">
        <section className="card">
          <h2 style={{ fontSize: "var(--fs-lg)" }}>Items</h2>
          {order.items.map((i) => (
            <div className="line" key={i.id} style={{ gridTemplateColumns: "84px 1fr auto" }}>
              <div className="line__img"><ImageWithFallback src={i.product_image} alt={i.product_name} /></div>
              <div className="line__info">
                <h3>{i.product_name}</h3>
                <div className="line__meta">{[i.size && `Size ${i.size}`, i.color, `Qty ${i.quantity}`].filter(Boolean).join(" · ")}</div>
                <div className="line__meta">{formatPrice(i.unit_price)} each</div>
              </div>
              <strong>{formatPrice(i.line_total)}</strong>
            </div>
          ))}
        </section>
        <div>
          <section className="card" style={{ marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "var(--fs-md)" }}>Shipping to</h2>
            <address style={{ fontStyle: "normal" }}>
              {order.full_name}<br />{order.address_line}<br />{order.city}, {order.state} {order.postal_code}<br />{order.country}
              <br /><span className="muted">{order.phone} · {order.email}</span>
            </address>
          </section>
          <section className="card summary" style={{ position: "static" }}>
            <h2 style={{ fontSize: "var(--fs-md)" }}>Payment summary</h2>
            <dl>
              <div className="summary__row"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {Number(order.discount_amount) > 0 && <div className="summary__row summary__row--discount"><dt>Discount</dt><dd>-{formatPrice(order.discount_amount)}</dd></div>}
              <div className="summary__row"><dt>Shipping</dt><dd>{Number(order.shipping_charge) === 0 ? "Free" : formatPrice(order.shipping_charge)}</dd></div>
              <div className="summary__row summary__row--total"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
