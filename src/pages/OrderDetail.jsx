import { Link, useParams } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderDetailView from "../components/OrderDetailView";
import useAsync from "../hooks/useAsync";
import { orderService } from "../services";

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, loading, error, reload } = useAsync(() => orderService.get(id), [id]);
  return (
    <div className="page">
      <div className="container">
        <div className="breadcrumbs"><Link to="/orders">My orders</Link> / {order?.order_number}</div>
        <h1 className="page-title">Order details</h1>
        {loading && <LoadingSpinner />}
        <ErrorMessage message={error} onRetry={reload} />
        {order && <OrderDetailView order={order} />}
      </div>
    </div>
  );
}
