import { ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import ImageWithFallback from "../components/ImageWithFallback";
import LoadingSpinner from "../components/LoadingSpinner";
import Price from "../components/Price";
import ProductGrid from "../components/ProductGrid";
import QuantitySelector from "../components/QuantitySelector";
import Rating from "../components/Rating";
import SizeSelector from "../components/SizeSelector";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import useAsync from "../hooks/useAsync";
import { productService } from "../services";
import { parseApiError } from "../utils/format";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, rules } = useCart();
  const toast = useToast();
  const { data: product, loading, error, reload } = useAsync(() => productService.get(id), [id]);

  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [errors, setErrors] = useState({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setSize(""); setQuantity(1); setActiveImage(0); setErrors({});
    setColor(product?.colors?.length === 1 ? product.colors[0].name : "");
  }, [product?.id]);

  const images = product?.images || [];
  const visibleImages = useMemo(() => {
    if (!color) return images;
    const shared = images.filter((i) => !i.color);
    const specific = images.filter((i) => i.color === color);
    return specific.length ? [...specific, ...shared] : images;
  }, [images, color]);

  useEffect(() => setActiveImage(0), [color]);

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (error) return <div className="page container"><ErrorMessage message={error} onRetry={reload} /><Link to="/shop" className="btn btn--primary">Back to shop</Link></div>;

  const maxQty = Math.max(1, Math.min(product.stock_quantity, rules.max_line_quantity));
  const stockLabel = !product.in_stock ? ["stock--out", "Out of stock"] : product.stock_quantity <= 5 ? ["stock--low", `Only ${product.stock_quantity} left`] : ["stock--in", "In stock"];
  const current = visibleImages[activeImage] || visibleImages[0];

  const validate = () => {
    const e = {};
    if (product.sizes.length && !size) e.size = "Please select a size.";
    if (product.colors.length && !color) e.color = "Please select a color.";
    if (!product.in_stock) e.stock = "This product is currently out of stock.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const add = async (goToCart = false) => {
    if (!validate()) return;
    setAdding(true);
    try {
      await addItem({ product, size, color, quantity });
      toast.success(`${product.name} added to your cart.`);
      if (goToCart) navigate("/cart");
    } catch (err) {
      const { message, fields } = err.friendly ? { message: err.message, fields: {} } : parseApiError(err);
      setErrors({ form: fields.quantity || fields.size || fields.color || message });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link> / {product.name}
        </div>
        <div className="pd">
          <div className="pd__gallery">
            <div className="pd__main"><ImageWithFallback src={current?.url || product.image} alt={current?.alt || product.name} loading="eager" /></div>
            {visibleImages.length > 1 && (
              <div className="pd__thumbs">
                {visibleImages.map((img, i) => (
                  <button key={img.id} type="button" className="pd__thumb" aria-current={i === activeImage} aria-label={`Show image ${i + 1}`} onClick={() => setActiveImage(i)}>
                    <ImageWithFallback src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="eyebrow">{product.category.name} · {product.audience}</div>
            <h1 style={{ marginBottom: 8 }}>{product.name}</h1>
            <Rating value={product.rating} count={product.review_count} />
            <div style={{ margin: "12px 0" }}>
              <Price className="pd__price" current={product.current_price} original={product.discount_price ? product.price : null} />
              {product.discount_percent > 0 && <span className="badge badge--sale">Save {product.discount_percent}%</span>}
            </div>
            <p className="muted">{product.description}</p>
            <p className={`stock ${stockLabel[0]}`}>{stockLabel[1]}</p>

            {product.colors.length > 0 && (
              <div className="pd__block">
                <div className="label"><span>Color{color && `: ${color}`}</span></div>
                <div className="chip-row" role="group" aria-label="Select color">
                  {product.colors.map((c) => (
                    <button key={c.name} type="button" className="color-chip" aria-pressed={color === c.name} onClick={() => setColor(c.name)}>
                      <span className="swatch-dot" style={{ background: c.hex, width: 20, height: 20 }} /> {c.name}
                    </button>
                  ))}
                </div>
                {errors.color && <p className="field__error" role="alert" style={{ marginTop: 8 }}>{errors.color}</p>}
              </div>
            )}

            {product.sizes.length > 0 && (
              <div className="pd__block">
                <div className="label"><span>Size (UK)</span></div>
                <SizeSelector sizes={product.sizes} value={size} onChange={(s) => { setSize(s); setErrors((e) => ({ ...e, size: "" })); }} error={errors.size} />
              </div>
            )}

            <div className="pd__block">
              <div className="label"><span>Quantity</span></div>
              <QuantitySelector value={Math.min(quantity, maxQty)} max={maxQty} disabled={!product.in_stock} onChange={setQuantity} />
            </div>

            {(errors.form || errors.stock) && <div className="alert alert--error" role="alert">{errors.form || errors.stock}</div>}
            <div className="pd__buy">
              <button type="button" className="btn btn--primary" disabled={!product.in_stock || adding} onClick={() => add(false)}>
                <ShoppingBag size={18} /> {adding ? "Adding..." : "Add to cart"}
              </button>
              <button type="button" className="btn btn--accent" disabled={!product.in_stock || adding} onClick={() => add(true)}>Buy now</button>
            </div>
            <p className="muted" style={{ fontSize: "var(--fs-sm)", marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
              <Truck size={16} /> Free shipping on orders over {Number(rules.free_shipping_threshold).toFixed(0)}.
            </p>

            {Object.keys(product.specifications || {}).length > 0 && (
              <div className="pd__block">
                <h2 style={{ fontSize: "var(--fs-md)" }}>Specifications</h2>
                <table className="specs">
                  <tbody>
                    {Object.entries(product.specifications).map(([k, v]) => (<tr key={k}><th>{k}</th><td>{v}</td></tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {product.related.length > 0 && (
          <section style={{ marginTop: "var(--space-8)" }}>
            <h2>You may also like</h2>
            <ProductGrid products={product.related} />
          </section>
        )}
      </div>
    </div>
  );
}
