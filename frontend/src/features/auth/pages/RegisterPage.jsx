import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import ThemeToggle from "../../../components/ThemeToggle";
import { extractErrorMessage, register as registerRequest } from "../api";
import { useAuth } from "../useAuth";
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from "../validators";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const errors = {
    fullName: validateFullName(fullName),
    email: validateEmail(email),
    password: validatePassword(password),
  };
  const isValid = !errors.fullName && !errors.email && !errors.password;

  function markTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ fullName: true, email: true, password: true });
    if (!isValid) return;

    setSubmitting(true);
    setFormError("");
    try {
      await registerRequest({
        email,
        password,
        full_name: fullName.trim(),
      });
      await login({ email, password });
      navigate("/dashboard", { replace: true });
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
          <Badge variant="accent" style={{ marginBottom: "8px" }}>New Student Registration</Badge>
          <h1 className="auth-title">Join Student Brain</h1>
          <p className="auth-subtitle">Create your account to start planning routines and tracking grades.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="fullName"
            label="Full Name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Jane Doe"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            onBlur={() => markTouched("fullName")}
            error={touched.fullName ? errors.fullName : ""}
            disabled={submitting}
            required
          />

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Must be at least 8 characters long."
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
            Create Workspace Account
          </Button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
