export default function FormError({ message, id, className = "" }) {
  if (!message) return null;
  return (
    <p id={id} className={`form-error ${className}`.trim()} role="alert">
      {message}
    </p>
  );
}
