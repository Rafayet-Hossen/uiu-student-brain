import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import ThemeToggle from "../../../components/ThemeToggle";
import { extractErrorMessage } from "../api";
import { useAuth } from "../useAuth";
import { validateEmail, validatePassword } from "../validators";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
  };
  const isValid = !errors.email && !errors.password;

  function markTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;

    setSubmitting(true);
    setFormError("");
    try {
      await login({ email, password });
      const redirectTo = location.state?.from || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>

      <div className="auth-brand-badge">
        <span>🎓</span>
        <span>Student<span style={{ color: "var(--color-accent)" }}>Brain</span></span>
      </div>

      <Card className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <Badge variant="accent" style={{ marginBottom: "8px" }}>Academic Portal</Badge>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your academic workspace to continue.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            label="University / Student Email"
            type="email"
            autoComplete="email"
            placeholder="student@university.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => markTouched("email")}
            error={touched.email ? errors.email : ""}
            disabled={submitting}
            required
          />

          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => markTouched("password")}
            error={touched.password ? errors.password : ""}
            disabled={submitting}
            required
          />

          <FormError message={formError} className="form-error-block" />

          <Button
            type="submit"
            className="btn-block"
            loading={submitting}
            disabled={!isValid || submitting}
          >
            Sign In to Workspace
          </Button>
        </form>

        <p className="auth-switch">
          New to Student Brain? <Link to="/register">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
