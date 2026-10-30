import { AlertCircle } from "lucide-react";

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert alert--error" role="alert">
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>
        <div>{message}</div>
        {onRetry && (
          <button type="button" className="btn btn--outline btn--sm" style={{ marginTop: 8 }} onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
