import { Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import { StatusBadge } from "../components/OrderDetailView";
import Pagination from "../components/Pagination";
import useAsync from "../hooks/useAsync";
import { orderService } from "../services";
import { formatDate, formatPrice } from "../utils/format";

const PAGE_SIZE = 12;

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => orderService.list(page), [page]);

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-title">My orders</h1>
        {loading && <LoadingSpinner />}
        <ErrorMessage message={error} onRetry={reload} />
        {data && data.results.length === 0 && (
          <div className="empty-state card">
            <Package size={44} color="var(--color-primary)" />
            <h2>No orders yet</h2>
            <p className="muted">When you place an order it will show up here.</p>
            <Link to="/shop" className="btn btn--primary">Start shopping</Link>
          </div>
        )}
        {data?.results.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="card order-card">
            <div><strong>{o.order_number}</strong><div className="muted" style={{ fontSize: "var(--fs-sm)" }}>{formatDate(o.created_at)} · {o.items.length} {o.items.length === 1 ? "item" : "items"}</div></div>
            <StatusBadge status={o.status} label={o.status_display} />
            <strong>{formatPrice(o.total)}</strong>
          </Link>
        ))}
        {data && <Pagination page={page} totalPages={Math.ceil(data.count / PAGE_SIZE)} onChange={setPage} />}
      </div>
    </div>
  );
}
