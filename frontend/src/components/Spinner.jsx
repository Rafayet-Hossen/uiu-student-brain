export default function Spinner({ standalone = false }) {
  return (
    <span
      className={`spinner ${standalone ? "spinner-standalone" : ""}`.trim()}
      role="status"
      aria-label="Loading"
    />
  );
}
