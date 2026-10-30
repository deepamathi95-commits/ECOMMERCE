export default function CategoryFilter({ categories = [], selected = "", onChange, title = "Category" }) {
  return (
    <div className="filter-block">
      <h3>{title}</h3>
      <ul className="filter-list">
        <li>
          <button type="button" aria-pressed={!selected} onClick={() => onChange("")}>
            <span>All</span>
          </button>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <button type="button" aria-pressed={selected === c.slug} onClick={() => onChange(c.slug)}>
              <span>{c.name}</span>
              <span className="muted">{c.product_count}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
