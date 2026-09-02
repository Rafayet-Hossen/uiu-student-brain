import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function Input({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  success,
  disabled = false,
  required = false,
  className = "",
  helperText,
  icon: Icon,
  ...props
}) {
  return (
    <div className={`form-field-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-field-label">
          <span>{label}</span>
          {required && <span className="form-required-mark">*</span>}
        </label>
      )}

      <div className="input-relative-container">
        {Icon && <Icon size={16} className="input-leading-icon" />}

        <input
          id={id}
          name={name || id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`form-input-control ${Icon ? "input-with-leading-icon" : ""} ${
            error ? "input-error-state" : ""
          } ${success ? "input-success-state" : ""}`}
          {...props}
        />

        {error && <AlertCircle size={16} className="input-trailing-error-icon" />}
        {success && <CheckCircle2 size={16} className="input-trailing-success-icon" />}
      </div>

      {error ? (
        <p className="form-field-error-text">{error}</p>
      ) : helperText ? (
        <p className="form-field-helper-text">{helperText}</p>
      ) : null}
    </div>
  );
}
