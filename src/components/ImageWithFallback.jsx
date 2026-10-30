import { useState } from "react";

const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f1efec"/><path d="M110 250c0-40 20-70 50-70s40 30 70 30v40c0 10-10 20-20 20H130c-10 0-20-10-20-20z" fill="#2F4F4F" opacity=".25"/><text x="200" y="330" text-anchor="middle" font-family="Georgia,serif" font-size="18" fill="#667373">Image unavailable</text></svg>`
  );

export default function ImageWithFallback({ src, alt, ...rest }) {
  const [failed, setFailed] = useState(false);
  return <img src={failed || !src ? PLACEHOLDER : src} alt={alt || ""} loading="lazy" onError={() => setFailed(true)} {...rest} />;
}
