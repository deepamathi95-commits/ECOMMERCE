import { ArrowRight, Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage";
import ImageWithFallback from "../components/ImageWithFallback";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductGrid from "../components/ProductGrid";
import { useCart } from "../context/CartContext";
import useAsync from "../hooks/useAsync";
import { productService } from "../services";
import { formatPrice } from "../utils/format";

function ProductSection({ eyebrow, title, params, link, soft }) {
  const { data, loading, error, reload } = useAsync(() => productService.list({ page_size: 8, ...params }), [JSON.stringify(params)]);
  return (
    <section className={`section ${soft ? "section--soft" : ""}`}>
      <div className="container">
        <div className="section__head">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2>{title}</h2>
          </div>
          <Link className="link-arrow" to={link}>View all</Link>
        </div>
        {loading && <LoadingSpinner />}
        <ErrorMessage message={error} onRetry={reload} />
        {data && <ProductGrid products={data.results} />}
      </div>
    </section>
  );
}

export default function Home() {
  const { rules } = useCart();
  const cats = useAsync(() => productService.categories(), []);

  return (
    <>
      <section className="hero">
        <img className="hero__bg" src="/images/banners/hero-sneakers.jpg" alt="" />
        <div className="container">
          <div className="hero__inner">
            <div className="eyebrow" style={{ color: "var(--color-secondary)" }}>New season · Just landed</div>
            <h1>Find the pair that <em>steps up</em> your day</h1>
            <p>Sneakers, loafers, boots, sandals and heels for men, women and kids. Comfortable, stylish and delivered to your door.</p>
            <div className="hero__cta">
              <Link to="/shop" className="btn btn--accent">Shop now <ArrowRight size={18} /></Link>
              <Link to="/shop?ordering=newest" className="btn btn--outline" style={{ color: "#fff", borderColor: "#fff" }}>New arrivals</Link>
            </div>
            <div className="hero__stats">
              <div><strong>40+</strong><span>Styles</span></div>
              <div><strong>3</strong><span>Collections</span></div>
              <div><strong>Free</strong><span>Shipping over {formatPrice(rules.free_shipping_threshold)}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: "var(--space-6)" }}>
        <div className="perks card" style={{ padding: "var(--space-3)" }}>
          <div className="perk"><Truck /><div><strong>Fast delivery</strong><span>Tracked from our door to yours</span></div></div>
          <div className="perk"><RotateCcw /><div><strong>Easy exchanges</strong><span>Wrong size? We'll sort it</span></div></div>
          <div className="perk"><ShieldCheck /><div><strong>Secure checkout</strong><span>Your details stay protected</span></div></div>
          <div className="perk"><Headphones /><div><strong>Friendly support</strong><span>Ask us anything, anytime</span></div></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div><div className="eyebrow">Browse</div><h2>Shop by category</h2></div>
          </div>
          {cats.loading && <LoadingSpinner />}
          <ErrorMessage message={cats.error} onRetry={cats.reload} />
          <div className="cat-grid">
            {(cats.data || []).map((c) => (
              <Link key={c.slug} to={`/shop?category=${c.slug}`} className="cat-tile">
                <ImageWithFallback src={c.image} alt="" />
                <div><h3>{c.name}</h3><span>{c.product_count} styles</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductSection eyebrow="Handpicked" title="Featured shoes" params={{ featured: "true" }} link="/shop" soft />

      <section className="section">
        <div className="container">
          <div className="promo-grid">
            {[
              ["men", "Men", "Smart, sturdy and made to move.", "/images/banners/men.png"],
              ["women", "Women", "From everyday flats to evening heels.", "/images/banners/women.png"],
              ["kids", "Kids", "Playful pairs built for busy feet.", "/images/banners/kids.png"],
            ].map(([key, title, text, img]) => (
              <Link key={key} to={`/shop?audience=${key}`} className="promo">
                <ImageWithFallback src={img} alt={`${title} collection`} />
                <div className="promo__body">
                  <h3>{title}</h3>
                  <p style={{ marginBottom: 12 }}>{text}</p>
                  <span className="btn btn--accent btn--sm">Shop {title.toLowerCase()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductSection eyebrow="Just in" title="New arrivals" params={{ ordering: "newest" }} link="/shop?ordering=newest" soft />

      <section className="section">
        <div className="container">
          <div className="offer">
            <div className="offer__text">
              <div className="eyebrow">Limited offer</div>
              <h2>Up to 25% off selected styles</h2>
              <p>Save on loafers, running shoes, heels and more while stocks last. Free shipping once your order reaches {formatPrice(rules.free_shipping_threshold)}.</p>
              <Link to="/shop?ordering=price_asc" className="btn btn--primary">Shop the offers</Link>
            </div>
            <div className="offer__img"><ImageWithFallback src="/images/banners/red-heels.jpg" alt="Red patent heels" /></div>
          </div>
        </div>
      </section>

      <ProductSection eyebrow="Customer favourites" title="Best sellers" params={{ best_seller: "true" }} link="/shop?ordering=popular" />
    </>
  );
}
