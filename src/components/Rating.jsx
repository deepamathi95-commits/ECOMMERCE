import { Star } from "lucide-react";

export default function Rating({ value, count }) {
  if (!Number(value)) return null;
  return (
    <span className="rating" aria-label={`Rated ${value} out of 5`}>
      <Star size={14} /> {Number(value).toFixed(1)}
      {count ? <span>({count})</span> : null}
    </span>
  );
}
