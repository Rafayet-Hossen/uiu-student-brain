import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Info, Sparkles } from "lucide-react";
import { extractErrorMessage } from "../api";
import { useAuth } from "../useAuth";
import { validateEmail, validatePassword } from "../validators";
import AuthOrbitalShowcase from "../components/AuthOrbitalShowcase";
import AuthAmbientBackground from "../components/AuthAmbientBackground";
import AuthPillInput from "../components/AuthPillInput";
import FormError from "../../../components/FormError";
import ThemeToggle from "../../../components/ThemeToggle";
import StudentBrainLogo from "../../../components/StudentBrainLogo";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

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
    setNotice("");
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

  function handleGoogleLogin() {
    setNotice(
      "Google Sign-In integration is configured. Please see the setup guide to connect your Google Cloud OAuth Client ID.",
    );
  }

  return (
    <div className="auth-sb-screen">
      <AuthAmbientBackground />

      {/* Top Header Bar */}
      <header className="auth-sb-topbar">
        <Link to="/" className="auth-sb-brand">
          <StudentBrainLogo size={28} />
          <span className="auth-sb-brand-name">
            Student<span className="auth-sb-brand-accent">Brain</span>
          </span>
        </Link>

        <div className="auth-sb-top-actions">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content View */}
      <main className="auth-sb-main">
        {/* Left Column: Academic Intelligence Showcase (Desktop) */}
        <div className="auth-sb-left-col">
          <AuthOrbitalShowcase />
        </div>

        {/* Right Column: Clean, Minimalist Auth Card */}
        <div className="auth-sb-right-col">
          <div className="auth-sb-card">
            {/* Card Header */}
            <div className="auth-sb-card-header">
              <div className="auth-mobile-badge mobile-only">
                <Sparkles size={13} className="text-orange" />
                <span>Academic Portal</span>
              </div>
              <h2 className="auth-sb-title">Welcome Back 👋</h2>
              <p className="auth-sb-subtitle">
                Sign in to continue your academic journey.
              </p>
            </div>

            {notice && (
              <div className="auth-sb-notice-box">
                <Info size={15} />
                <span>{notice}</span>
              </div>
            )}

            {/* Quick Google Sign In Button */}
            <button
              type="button"
              className="auth-sb-google-btn"
              onClick={handleGoogleLogin}
              disabled={submitting}
            >
              <svg
                className="google-icon-svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-sb-divider">
              <span>or email</span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} noValidate className="auth-sb-form">
              <AuthPillInput
                id="email"
                label="Student / University Email"
                type="email"
                autoComplete="email"
                placeholder="e.g. name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                error={touched.email ? errors.email : ""}
                disabled={submitting}
                required
              />

              <AuthPillInput
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => markTouched("password")}
                error={touched.password ? errors.password : ""}
                disabled={submitting}
                required
              />

              <div className="auth-sb-forgot-row">
                <button
                  type="button"
                  className="auth-sb-forgot-link"
                  onClick={() =>
                    setNotice(
                      "To reset your credentials, please contact your university administrator or support.",
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <FormError message={formError} className="form-error-block" />

              <button
                type="submit"
                className="auth-sb-primary-btn"
                disabled={!isValid || submitting}
              >
                {submitting ? "Signing in..." : "Sign In to StudentBrain"}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="auth-sb-switch">
              <span>Don't have an account? </span>
              <Link to="/register" className="auth-sb-switch-link">
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
