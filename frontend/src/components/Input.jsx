import FormError from "./FormError";

export default function Input({ id, label, error, hint, ...props }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        className={`field-input ${error ? "field-input-error" : ""}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {!error && hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
      <FormError id={`${id}-error`} message={error} />
    </div>
  );
}
