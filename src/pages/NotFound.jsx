import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page container">
      <div className="empty-state card">
        <h1>404</h1>
        <h2>We couldn't find that page</h2>
        <p className="muted">The link may be broken or the page may have moved.</p>
        <Link to="/" className="btn btn--primary">Back to home</Link>
      </div>
    </div>
  );
}
