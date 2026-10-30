import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CartItem from "../components/CartItem";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderSummary from "../components/OrderSummary";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { parseApiError } from "../utils/format";

export default function Cart() {
  const { items, summary, loading, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); } catch (err) { setError(parseApiError(err).message); } finally { setBusy(false); }
  };

  if (loading) return <div className="page"><LoadingSpinner label="Loading your cart..." /></div>;

  if (items.length === 0) {
    return (
      <div className="page container">
        <div className="empty-state card">
          <ShoppingBag size={44} color="var(--color-primary)" />
          <h2>Your cart is empty</h2>
          <p className="muted">Looks like you haven't added any shoes yet.</p>
          <Link to="/shop" className="btn btn--primary">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">Shopping cart</h1>
        <ErrorMessage message={error} />
        <div className="split">
          <section aria-label="Cart items">
            {items.map((item) => (
              <CartItem key={item.id ?? item.key} item={item} busy={busy}
                onQuantity={(i, q) => run(() => updateQuantity(i, q))} onRemove={(i) => run(() => removeItem(i))} />
            ))}
            <div style={{ marginTop: "var(--space-5)" }}>
              <Link to="/shop" className="btn btn--outline">Continue shopping</Link>
            </div>
          </section>
          <OrderSummary summary={summary}>
            <button type="button" className="btn btn--primary btn--block" disabled={busy}
              onClick={() => navigate(isAuthenticated ? "/checkout" : "/login", { state: { from: "/checkout" } })}>
              Proceed to checkout
            </button>
            {!isAuthenticated && <p className="muted" style={{ fontSize: "var(--fs-xs)", marginTop: 12, marginBottom: 0 }}>You'll be asked to log in or create an account. Your cart is saved.</p>}
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
