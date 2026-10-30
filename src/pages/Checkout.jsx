import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import FormInput from "../components/FormInput";
import ImageWithFallback from "../components/ImageWithFallback";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderSummary from "../components/OrderSummary";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { authService, orderService } from "../services";
import { formatPrice, parseApiError } from "../utils/format";

const REQUIRED = ["full_name", "email", "phone", "address_line", "city", "state", "postal_code", "country"];
const LABELS = { full_name: "Full name", email: "Email", phone: "Phone number", address_line: "Street address", city: "City", state: "State / Province", postal_code: "Postal code", country: "Country" };

export default function Checkout() {
  const { user } = useAuth();
  const { items, summary, loading, clearLocal, refresh } = useCart();
  const navigate = useNavigate();
  const idempotencyKey = useRef(crypto.randomUUID()); // same key on retries/double-clicks -> one order
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address_line: "", city: "", state: "", postal_code: "", country: "" });
  const [payment, setPayment] = useState("cod");
  const [simOutcome, setSimOutcome] = useState("success");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);

  useEffect(() => {
    setForm((f) => ({ ...f, full_name: f.full_name || `${user.first_name} ${user.last_name}`.trim(), email: f.email || user.email, phone: f.phone || user.phone || "" }));
    authService.addresses().then((list) => {
      setAddresses(list);
      const def = list.find((a) => a.is_default) || list[0];
      if (def) pickAddress(def);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const pickAddress = (a) => {
    setSelectedAddress(a.id);
    setForm((f) => ({ ...f, full_name: a.full_name, phone: a.phone, address_line: a.address_line, city: a.city, state: a.state, postal_code: a.postal_code, country: a.country }));
  };
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setSelectedAddress(null); };

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (items.length === 0 && !submitted.current) {
    return (
      <div className="page container"><div className="empty-state card">
        <h2>Your cart is empty</h2><p className="muted">Add some shoes before checking out.</p>
        <Link to="/shop" className="btn btn--primary">Browse shoes</Link>
      </div></div>
    );
  }

  const validate = () => {
    const e = {};
    REQUIRED.forEach((k) => { if (!String(form[k]).trim()) e[k] = `${LABELS[k]} is required.`; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (form.phone && !/^\+?[0-9 ()\-]{7,20}$/.test(form.phone)) e.phone = "Enter a valid phone number.";
    if (form.postal_code && !/^[A-Za-z0-9][A-Za-z0-9 \-]{2,11}$/.test(form.postal_code.trim())) e.postal_code = "Enter a valid postal code.";
    return e;
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (busy) return;
    const local = validate();
    setErrors(local); setMessage("");
    if (Object.keys(local).length) { setMessage("Please correct the highlighted fields."); return; }
    setBusy(true);
    try {
      const order = await orderService.create({
        shipping: Object.fromEntries(REQUIRED.map((k) => [k, String(form[k]).trim()])),
        payment_method: payment,
        simulated_outcome: payment === "simulated" ? simOutcome : undefined,
        idempotency_key: idempotencyKey.current,
        items: items.map((i) => ({ product_id: i.product.id, size: i.size, color: i.color, quantity: i.quantity })),
      });
      submitted.current = true;
      clearLocal();
      navigate(`/order-confirmation/${order.id}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      const { message: m, fields } = parseApiError(err);
      const mapped = {};
      Object.entries(fields).forEach(([k, v]) => { if (k.startsWith("shipping.")) mapped[k.slice(9)] = v; });
      setErrors(mapped);
      setMessage(err.response?.status === 402 ? `${m} You can try again or choose Cash on Delivery.` : m);
      if (err.response?.status === 400) refresh().catch(() => {}); // stock may have changed
      if (err.response?.status === 402) idempotencyKey.current = crypto.randomUUID();
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Checkout</h1>
        <form onSubmit={placeOrder} noValidate>
          <div className="split">
            <div>
              <ErrorMessage message={message} />
              <section className="card" style={{ marginBottom: "var(--space-5)" }}>
                <h2 style={{ fontSize: "var(--fs-lg)" }}>Shipping details</h2>
                {addresses.length > 0 && (
                  <div className="address-pick" role="group" aria-label="Saved addresses">
                    {addresses.map((a) => (
                      <button key={a.id} type="button" className="address-card" aria-pressed={selectedAddress === a.id} onClick={() => pickAddress(a)}>
                        <strong>{a.label || "Saved address"}</strong><br />{a.address_line}, {a.city}
                      </button>
                    ))}
                  </div>
                )}
                <div className="form-grid">
                  <FormInput label="Full name" required autoComplete="name" value={form.full_name} error={errors.full_name} onChange={set("full_name")} />
                  <FormInput label="Email" type="email" required autoComplete="email" value={form.email} error={errors.email} onChange={set("email")} />
                  <FormInput label="Phone number" type="tel" required autoComplete="tel" value={form.phone} error={errors.phone} onChange={set("phone")} />
                  <FormInput label="Country" required autoComplete="country-name" value={form.country} error={errors.country} onChange={set("country")} />
                  <FormInput label="Street address" required className="span-2" autoComplete="street-address" value={form.address_line} error={errors.address_line} onChange={set("address_line")} />
                  <FormInput label="City" required autoComplete="address-level2" value={form.city} error={errors.city} onChange={set("city")} />
                  <FormInput label="State / Province" required autoComplete="address-level1" value={form.state} error={errors.state} onChange={set("state")} />
                  <FormInput label="Postal code" required autoComplete="postal-code" value={form.postal_code} error={errors.postal_code} onChange={set("postal_code")} />
                </div>
              </section>

              <section className="card">
                <h2 style={{ fontSize: "var(--fs-lg)" }}>Payment method</h2>
                <label className="pay-option">
                  <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                  <span><strong>Cash on Delivery</strong><small>Pay in cash when your order arrives.</small></span>
                </label>
                <label className="pay-option">
                  <input type="radio" name="payment" checked={payment === "simulated"} onChange={() => setPayment("simulated")} />
                  <span><strong>Simulated payment (demo only)</strong><small>No card is needed and no real money is charged. Use this to try the paid-order flow.</small></span>
                </label>
                {payment === "simulated" && (
                  <FormInput as="select" label="Simulate this outcome" value={simOutcome} onChange={(e) => setSimOutcome(e.target.value)}>
                    <option value="success">Payment succeeds</option>
                    <option value="decline">Payment is declined</option>
                  </FormInput>
                )}
              </section>
            </div>

            <OrderSummary summary={summary} title="Your order">
              <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 16 }}>
                {items.map((i) => (
                  <div key={i.id ?? i.key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", fontSize: "var(--fs-sm)" }}>
                    <div style={{ width: 52, height: 52, background: "var(--color-media-bg)", borderRadius: 8, flexShrink: 0 }}><ImageWithFallback src={i.product.image} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} /></div>
                    <div style={{ flex: 1 }}>{i.product.name}<div className="muted" style={{ fontSize: "var(--fs-xs)" }}>{[i.size && `Size ${i.size}`, i.color, `Qty ${i.quantity}`].filter(Boolean).join(" · ")}</div></div>
                    <span>{formatPrice(i.line_total)}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn--primary btn--block" disabled={busy}>
                {busy ? "Placing order..." : `Place order · ${formatPrice(summary.total)}`}
              </button>
              <p className="muted" style={{ fontSize: "var(--fs-xs)", marginTop: 12, marginBottom: 0 }}>Prices and stock are verified again by our server when you place the order.</p>
            </OrderSummary>
          </div>
        </form>
      </div>
    </div>
  );
}
