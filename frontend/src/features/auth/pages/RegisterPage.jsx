import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../components/Button";
import Card from "../../../components/Card";
import FormError from "../../../components/FormError";
import Input from "../../../components/Input";
import { extractErrorMessage, register } from "../api";
import { validateEmail, validateFullName, validatePassword } from "../validators";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const errors = {
    full_name: validateFullName(fullName),
    email: validateEmail(email),
    password: validatePassword(password),
  };
  const isValid = !errors.full_name && !errors.email && !errors.password;

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => navigate("/login"), 1500);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  function markTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ full_name: true, email: true, password: true });
    if (!isValid) return;

    setSubmitting(true);
    setFormError("");
    try {
      await register({ email, password, full_name: fullName });
      setSuccess(true);
    } catch (error) {
      setFormError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="auth-screen">
        <Card className="auth-card">
          <h1 className="auth-title">Account created</h1>
          <p className="auth-subtitle">Redirecting you to login…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <Card className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start building your student brain.</p>
        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="full_name"
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            onBlur={() => markTouched("full_name")}
            error={touched.full_name ? errors.full_name : ""}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => markTouched("email")}
            error={touched.email ? errors.email : ""}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Use at least 8 characters."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => markTouched("password")}
            error={touched.password ? errors.password : ""}
          />
          <FormError message={formError} className="form-error-block" />
          <Button type="submit" loading={submitting} disabled={!isValid || submitting}>
            Create account
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
