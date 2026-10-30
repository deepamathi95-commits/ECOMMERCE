import { CheckCircle2 } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderDetailView from "../components/OrderDetailView";
import useAsync from "../hooks/useAsync";
import { orderService } from "../services";

export default function OrderConfirmation() {
  const { id } = useParams();
  const { state } = useLocation();
  const { data: order, loading, error, reload } = useAsync(() => orderService.get(id), [id]);

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (error) return <div className="page container"><ErrorMessage message={error} onRetry={reload} /></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="confirm">
          <div className="confirm__icon"><CheckCircle2 size={40} /></div>
          <h1>{state?.justPlaced ? "Thank you! Your order is placed." : "Order details"}</h1>
          <p className="muted">
            Order <strong>{order.order_number}</strong>. A confirmation will be sent to {order.email}.
            {order.payment_method === "cod" && " Please keep the exact amount ready for delivery."}
          </p>
        </div>
        <OrderDetailView order={order} />
        <div style={{ display: "flex", gap: 12, marginTop: "var(--space-5)", flexWrap: "wrap" }}>
          <Link to="/orders" className="btn btn--primary">View my orders</Link>
          <Link to="/shop" className="btn btn--outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
