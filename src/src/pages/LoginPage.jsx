import React, { useState } from "react";
import { ChevronRight, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function LoginPage({ onLogin, loading, error, successMessage, onSwitchToSignup, onGoogleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setFormError("Please enter your password.");
      return;
    }

    onLogin({ email: email.trim(), password });
  };

  return (
    <AuthLayout
      footer={
        <p className="signup-link">
          New here? <strong onClick={onSwitchToSignup}>Create account</strong>
        </p>
      }
    >
      <h2 className="auth-welcome">Welcome Back 👋</h2>

      <form className="login-form" onSubmit={handleSubmit}>
        {(error || formError) ? <div className="error-banner">{error || formError}</div> : null}
        {successMessage ? <div className="success-banner">{successMessage}</div> : null}

        <label className="field">
          <span>Email</span>
          <div className="icon-input">
            <Mail size={16} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </label>

        <label className="field">
          <span>Password</span>
          <div className="icon-input">
            <Lock size={16} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="icon-input-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <>
              Login <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="divider">
        <span>or continue with</span>
      </div>

      <button className="google-btn" type="button" onClick={onGoogleLogin} disabled={loading}>
        <span className="google-g">G</span>
        Continue with Google
      </button>
    </AuthLayout>
  );
}
