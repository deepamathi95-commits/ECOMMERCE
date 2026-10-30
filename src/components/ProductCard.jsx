import { Link } from "react-router-dom";
import ImageWithFallback from "./ImageWithFallback";
import Price from "./Price";
import Rating from "./Rating";

export default function ProductCard({ product }) {
  const to = `/product/${product.id}`;
  return (
    <article className="product-card">
      <div className="product-card__tags">
        {product.discount_percent > 0 && <span className="badge badge--sale">-{product.discount_percent}%</span>}
        {!product.in_stock && <span className="badge">Sold out</span>}
      </div>
      <Link to={to} className="product-card__media" aria-label={product.name}>
        <ImageWithFallback src={product.image} alt={product.name} />
      </Link>
      <div className="product-card__body">
        <span className="product-card__cat">{product.category?.name}</span>
        <h3 className="product-card__name">
          <Link to={to}>{product.name}</Link>
        </h3>
        <Rating value={product.rating} count={product.review_count} />
        {product.colors?.length > 0 && (
          <div className="product-card__swatches" aria-label={`Colors: ${product.colors.map((c) => c.name).join(", ")}`}>
            {product.colors.map((c) => (
              <span key={c.name} className="swatch-dot" style={{ background: c.hex }} title={c.name} />
            ))}
          </div>
        )}
        <Price current={product.current_price} original={product.discount_price ? product.price : null} />
        <div className="product-card__actions">
          <Link to={to} className="btn btn--outline btn--sm btn--block">
            {product.in_stock ? "Select options" : "View details"}
          </Link>
        </div>
      </div>
    </article>
  );
}
