import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import ImageWithFallback from "./ImageWithFallback";
import QuantitySelector from "./QuantitySelector";

export default function CartItem({ item, onQuantity, onRemove, busy }) {
  const meta = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ");
  const onSale = Number(item.list_price) > Number(item.unit_price);
  return (
    <div className="line">
      <Link to={`/product/${item.product.id}`} className="line__img">
        <ImageWithFallback src={item.product.image} alt={item.product.name} />
      </Link>
      <div className="line__info">
        <h3>
          <Link to={`/product/${item.product.id}`}>{item.product.name}</Link>
        </h3>
        {meta && <div className="line__meta">{meta}</div>}
        <div className="line__meta">
          {formatPrice(item.unit_price)} {onSale && <s>{formatPrice(item.list_price)}</s>}
        </div>
        <QuantitySelector value={item.quantity} max={item.max_quantity} disabled={busy} onChange={(q) => onQuantity(item, q)} />
        {item.quantity >= item.max_quantity && <div className="field__hint" style={{ marginTop: 6 }}>Maximum available quantity reached.</div>}
      </div>
      <div className="line__side">
        <strong>{formatPrice(item.line_total)}</strong>
        <button type="button" className="link-danger" onClick={() => onRemove(item)} disabled={busy}>
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </div>
  );
}
