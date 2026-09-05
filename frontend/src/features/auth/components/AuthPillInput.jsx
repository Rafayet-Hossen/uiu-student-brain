import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPillInput({
  id,
  name,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  autoComplete,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const effectiveType = isPasswordField
    ? showPassword
      ? "text"
      : "password"
    : type;

  return (
    <div className={`auth-pill-field-group ${className}`}>
      {label && (
        <label htmlFor={id} className="auth-pill-label">
          {label}
          {required && <span className="auth-pill-required">*</span>}
        </label>
      )}

      <div className="auth-pill-input-wrap">
        <input
          id={id}
          name={name || id}
          type={effectiveType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`auth-pill-control ${error ? "auth-pill-error" : ""}`}
          {...props}
        />

        {isPasswordField && (
          <button
            type="button"
            className="auth-pill-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={disabled}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && <p className="auth-pill-error-text">{error}</p>}
    </div>
  );
}
