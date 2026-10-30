import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CategoryFilter from "../components/CategoryFilter";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";
import PriceFilter from "../components/PriceFilter";
import ProductGrid from "../components/ProductGrid";
import SearchBar from "../components/SearchBar";
import useAsync from "../hooks/useAsync";
import { productService } from "../services";

const PAGE_SIZE = 12;
const AUDIENCES = ["men", "women", "kids"];
const SIZES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"];
const SORTS = [
  ["newest", "Newest"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"],
  ["rating", "Top rated"], ["popular", "Most popular"],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const q = Object.fromEntries(params.entries());
  const page = Math.max(1, Number(q.page) || 1);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  const cats = useAsync(() => productService.categories(), []);
  const key = params.toString();
  const { data, loading, error, reload } = useAsync(
    () => productService.list({ ...q, page, page_size: PAGE_SIZE }),
    [key]
  );

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;
  const catName = useMemo(() => cats.data?.find((c) => c.slug === q.category)?.name, [cats.data, q.category]);

  const pills = [
    q.search && ["search", `“${q.search}”`], q.category && ["category", catName || q.category],
    q.audience && ["audience", q.audience[0].toUpperCase() + q.audience.slice(1)], q.size && ["size", `Size ${q.size}`],
    (q.min_price || q.max_price) && ["price", `Price ${q.min_price || 0} – ${q.max_price || "any"}`],
  ].filter(Boolean);
  const clearPill = (name) => (name === "price" ? update({ min_price: "", max_price: "" }) : update({ [name]: "" }));

  const filters = (
    <>
      <div className="filter-block" style={{ paddingTop: 0 }}>
        <h3>Search</h3>
        <SearchBar key={q.search || ""} initial={q.search || ""} onSearch={(v) => update({ search: v })} placeholder="Shoe name..." />
      </div>
      <div className="filter-block">
        <h3>Shop for</h3>
        <div className="chip-row">
          {AUDIENCES.map((a) => (
            <button key={a} type="button" className="chip" aria-pressed={q.audience === a} onClick={() => update({ audience: q.audience === a ? "" : a })}>
              {a[0].toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <CategoryFilter categories={cats.data || []} selected={q.category || ""} onChange={(slug) => update({ category: slug })} />
      <PriceFilter min={q.min_price || ""} max={q.max_price || ""} onApply={(lo, hi) => update({ min_price: lo, max_price: hi })} />
      <div className="filter-block">
        <h3>Size</h3>
        <div className="chip-row">
          {SIZES.map((s) => (
            <button key={s} type="button" className="chip" style={{ minWidth: 42, padding: "0 8px" }} aria-pressed={q.size === s} onClick={() => update({ size: q.size === s ? "" : s })}>{s}</button>
          ))}
        </div>
      </div>
      {pills.length > 0 && (
        <button type="button" className="btn btn--ghost btn--block" style={{ marginTop: 12 }} onClick={() => setParams({})}>Clear all filters</button>
      )}
    </>
  );

  return (
    <div className="page">
      <div className="container">
        <div className="breadcrumbs"><Link to="/">Home</Link> / Shop</div>
        <h1 className="page-title">{catName || (q.audience ? `${q.audience[0].toUpperCase()}${q.audience.slice(1)}'s shoes` : "All shoes")}</h1>

        <div className="shop">
          {filtersOpen && <div className="scrim" onClick={() => setFiltersOpen(false)} />}
          <aside className={`shop__filters ${filtersOpen ? "open" : ""}`} aria-label="Filters">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="shop__filter-toggle">
              <strong>Filters</strong>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X /></button>
            </div>
            {filters}
          </aside>

          <section>
            <div className="shop__bar">
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button type="button" className="btn btn--outline btn--sm shop__filter-toggle" onClick={() => setFiltersOpen(true)}>
                  <SlidersHorizontal size={16} /> Filters
                </button>
                <span className="muted" aria-live="polite">{data ? `${data.count} ${data.count === 1 ? "product" : "products"}` : ""}</span>
              </div>
              <label>
                <span className="sr-only">Sort by</span>
                <select value={q.ordering || "newest"} onChange={(e) => update({ ordering: e.target.value === "newest" ? "" : e.target.value })}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>

            {pills.length > 0 && (
              <div className="active-filters">
                {pills.map(([name, label]) => (
                  <button key={name} type="button" className="filter-pill" onClick={() => clearPill(name)} aria-label={`Remove filter ${label}`}>
                    {label} <X size={12} />
                  </button>
                ))}
              </div>
            )}

            {loading && <LoadingSpinner label="Finding shoes..." />}
            <ErrorMessage message={error} onRetry={reload} />
            {!loading && !error && data?.results.length === 0 && (
              <div className="empty-state card">
                <h2>No shoes match your filters</h2>
                <p className="muted">Try removing a filter or searching for something else.</p>
                <button type="button" className="btn btn--primary" onClick={() => setParams({})}>Clear filters</button>
              </div>
            )}
            {!loading && data?.results.length > 0 && (
              <>
                <ProductGrid products={data.results} />
                <Pagination page={page} totalPages={totalPages} onChange={(p) => update({ page: p === 1 ? "" : String(p) })} />
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
