export default function SizeSelector({ sizes = [], value, onChange, error }) {
  return (
    <div role="group" aria-label="Select size">
      <div className="chip-row">
        {sizes.map((s) => (
          <button key={s} type="button" className="chip" aria-pressed={value === s} onClick={() => onChange(s)}>
            {s}
          </button>
        ))}
      </div>
      {error && <p className="field__error" role="alert" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
