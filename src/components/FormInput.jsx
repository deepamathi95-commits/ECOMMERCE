import { useId } from "react";

/** Labeled field with inline error. `as` can be "input" (default), "select" or "textarea". */
export default function FormInput({ label, error, hint, required, as: Tag = "input", children, className = "", ...props }) {
  const id = useId();
  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <Tag id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} required={required} {...props}>
        {children}
      </Tag>
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" id={`${id}-err`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
