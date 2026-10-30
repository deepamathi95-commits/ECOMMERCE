import { formatPrice } from "../utils/format";

export default function Price({ current, original, className = "" }) {
  const onSale = original && Number(original) > Number(current);
  return (
    <div className={`price ${className}`}>
      <span className="price__now">{formatPrice(current)}</span>
      {onSale && <span className="price__was">{formatPrice(original)}</span>}
    </div>
  );
}
