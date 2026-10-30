const currency = import.meta.env?.VITE_CURRENCY || "USD";
const locale = import.meta.env?.VITE_LOCALE || "en-US";
const fmt = new Intl.NumberFormat(locale, { style: "currency", currency });

export const formatPrice = (value) => fmt.format(Number(value || 0));

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

/** Turns a DRF error response into { message, fields } for forms and banners. */
export function parseApiError(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!error?.response) return { message: "Cannot reach the server. Check your connection and try again.", fields: {} };
  if (!data || typeof data !== "object") return { message: fallback, fields: {} };
  const fields = {};
  const flatten = (obj, prefix = "") => {
    Object.entries(obj || {}).forEach(([key, val]) => {
      const name = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(val) && typeof val[0] === "string") fields[name] = val[0];
      else if (typeof val === "string") fields[name] = val;
      else if (val && typeof val === "object") flatten(val, name);
    });
  };
  flatten(data.errors);
  return { message: data.detail || fallback, fields };
}
