import { useEffect, useState } from "react";

export default function PriceFilter({ min = "", max = "", onApply }) {
  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);
  useEffect(() => { setLow(min); setHigh(max); }, [min, max]);
  const invalid = low !== "" && high !== "" && Number(low) > Number(high);
  return (
    <div className="filter-block">
      <h3>Price</h3>
      <div className="price-inputs">
        <input type="number" min="0" inputMode="decimal" placeholder="Min" value={low} onChange={(e) => setLow(e.target.value)} aria-label="Minimum price" />
        <span>-</span>
        <input type="number" min="0" inputMode="decimal" placeholder="Max" value={high} onChange={(e) => setHigh(e.target.value)} aria-label="Maximum price" />
      </div>
      {invalid && <p className="field__error" role="alert" style={{ marginTop: 8 }}>Minimum must be lower than maximum.</p>}
      <button type="button" className="btn btn--primary btn--sm btn--block" style={{ marginTop: 12 }} disabled={invalid} onClick={() => onApply(low, high)}>
        Apply price
      </button>
    </div>
  );
}
