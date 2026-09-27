import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Info } from "lucide-react";
import { extractErrorMessage, register as registerRequest } from "../api";
import { useAuth } from "../useAuth";
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from "../validators";
import AuthOrbitalShowcase from "../components/AuthOrbitalShowcase";
import AuthAmbientBackground from "../components/AuthAmbientBackground";
import AuthPillInput from "../components/AuthPillInput";
import FormError from "../../../components/FormError";
import ThemeToggle from "../../../components/ThemeToggle";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "97595115320-as37nh6t3kp0tgdgsad4o1jri6k5tmr6.apps.googleusercontent.com";

export default function RegisterPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const googleBtnRef = useRef(null);

  const errors = {
    fullName: validateFullName(fullName),
    email: validateEmail(email),
    password: validatePassword(password),
    confirmPassword: validateConfirmPassword(password, confirmPassword),
  };
  const isValid =
    !errors.fullName &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword;

  useEffect(() => {
    function handleCredentialResponse(response) {
      if (!response?.credential) return;
      setSubmitting(true);
      setFormError("");
      setNotice("");
      loginWithGoogle(response.credential)
        .then(() => {
          navigate("/dashboard", { replace: true });
        })
        .catch((error) => {
          setFormError(extractErrorMessage(error));
        })
        .finally(() => {
          setSubmitting(false);
        });
    }

    function initGsi() {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              type: "standard",
              shape: "pill",
              text: "signup_with",
              logo_alignment: "left",
              width: 320,
            });
          }
        } catch (err) {
          console.warn("Google SSO Init error:", err);
        }
      }
    }

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGsi();
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [loginWithGoogle, navigate]);

  function markTouched(field) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (!isValid) return;

    setSubmitting(true);
    setFormError("");
    setNotice("");
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

  function handleFallbackGoogleClick() {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setNotice("Please ensure popups or third-party cookies are allowed for Google Sign In.");
        }
      });
    } else {
      setNotice("Google Identity Service is loading. Please check your internet connection.");
    }
  }


  return (
    <div className="auth-sb-screen">
      <AuthAmbientBackground />

      {/* Top Header Bar */}
      <header className="auth-sb-topbar">
        <Link to="/" className="auth-sb-brand">
          <div className="auth-sb-brand-icon-box">
            <GraduationCap size={20} />
          </div>
          <span className="auth-sb-brand-name">
            Student<span className="auth-sb-brand-accent">Brain</span>
          </span>
        </Link>

        <div className="auth-sb-top-actions">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Split View (Strictly non-overflow on desktop) */}
      <main className="auth-sb-main">
        {/* Left Column: Academic Intelligence Showcase */}
        <div className="auth-sb-left-col">
          <AuthOrbitalShowcase />
        </div>

        {/* Right Column: Register Card */}
        <div className="auth-sb-right-col">
          <div className="auth-sb-card auth-sb-register-card">
            <div className="auth-sb-card-header">
              <h2 className="auth-sb-title">Create Account</h2>
              <p className="auth-sb-subtitle">
                Join your university peers on StudentBrain.
              </p>
            </div>

            {notice && (
              <div className="auth-sb-notice-box">
                <Info size={15} />
                <span>{notice}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="auth-sb-form">
              <AuthPillInput
                id="fullName"
                label="Full Name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => markTouched("fullName")}
                error={touched.fullName ? errors.fullName : ""}
                disabled={submitting}
                required
              />

              <AuthPillInput
                id="email"
                label="University / Student Email"
                type="email"
                autoComplete="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
                error={touched.email ? errors.email : ""}
                disabled={submitting}
                required
              />

              <div className="auth-sb-passwords-row">
                <AuthPillInput
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  error={touched.password ? errors.password : ""}
                  disabled={submitting}
                  required
                />

                <AuthPillInput
                  id="confirmPassword"
                  label="Confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => markTouched("confirmPassword")}
                  error={touched.confirmPassword ? errors.confirmPassword : ""}
                  disabled={submitting}
                  required
                />
              </div>

              <FormError message={formError} className="form-error-block" />

              <button
                type="submit"
                className="auth-sb-primary-btn"
                disabled={!isValid || submitting}
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="auth-sb-divider">
              <span>or</span>
            </div>

            <div className="auth-google-btn-wrapper">
              <div ref={googleBtnRef} className="auth-google-gsi-slot"></div>
              <button
                type="button"
                className="auth-sb-secondary-btn auth-google-fallback-btn"
                onClick={handleFallbackGoogleClick}
                disabled={submitting}
              >
                <svg
                  className="google-icon-svg"
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
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
                <span>Sign up with Google SSO</span>
              </button>
            </div>


            {/* Bottom Info Note */}
            <div className="auth-sb-info-card">
              <Info size={16} className="auth-sb-info-icon" />
              <p className="auth-sb-info-text">
                Free for university students. Includes routine generator, GPA
                calculator, and AI smart notes.
              </p>
            </div>

            {/* Switch to Login */}
            <div className="auth-sb-switch">
              <span>Already registered? </span>
              <Link to="/login" className="auth-sb-switch-link">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
