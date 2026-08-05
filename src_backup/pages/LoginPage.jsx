import React, { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function LoginPage({ onLogin, loading, error, successMessage, onSwitchToSignup, onGoogleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <form className="login-form" onSubmit={handleSubmit}>
        {(error || formError) ? <div className="error-banner">{error || formError}</div> : null}
        {successMessage ? <div className="success-banner">{successMessage}</div> : null}

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <>
              Log in <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="divider">
        <span>or</span>
      </div>

      <button className="google-btn" type="button" onClick={onGoogleLogin} disabled={loading}>
        <span className="google-g">G</span>
        Continue with Google
      </button>
    </AuthLayout>
  );
}
