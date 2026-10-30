import { Heart, Leaf, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "../components/ImageWithFallback";

export default function About() {
  return (
    <div className="page">
      <div className="container">
        <div className="about-hero">
          <div>
            <div className="eyebrow">Our story</div>
            <h1>Shoes made for every step you take</h1>
            <p className="muted">StepUp started with a simple idea: everyone deserves shoes that feel as good as they look. We bring together comfortable everyday sneakers, polished formal pairs, easy sandals and statement heels for men, women and kids.</p>
            <p className="muted">Every pair in our collection is chosen for comfort, quality and style. Browse online, pick your size and let us handle the rest, from careful packing to doorstep delivery.</p>
            <Link to="/shop" className="btn btn--primary">Explore the collection</Link>
          </div>
          <ImageWithFallback src="/images/brand/stepup-logo.jpg" alt="StepUp brand mark" />
        </div>

        <section style={{ marginTop: "var(--space-8)" }}>
          <div className="section__head"><h2>What we stand for</h2></div>
          <div className="values">
            {[[Heart, "Comfort first", "Soft footbeds, flexible soles and honest sizing so you can wear them all day."],
              [Sparkles, "Style for all", "Classic and current designs across men's, women's and kids' collections."],
              [Leaf, "Made to last", "Durable materials and careful finishing so every pair keeps going."]].map(([Icon, title, text]) => (
              <div className="card" key={title}><Icon color="var(--color-primary)" /><h3 style={{ marginTop: 12 }}>{title}</h3><p className="muted" style={{ marginBottom: 0 }}>{text}</p></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
