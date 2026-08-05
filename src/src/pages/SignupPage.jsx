import React, { useState } from "react";
import { ChevronRight, Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function SignupPage({ onSignup, loading, error, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setFormError("Please enter your email address.");
      return;
    }

    if (!password) {
      setFormError("Please choose a password.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password should be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    onSignup({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <AuthLayout
      footer={
        <p className="signup-link">
          Already have an account? <strong onClick={onSwitchToLogin}>Log in</strong>
        </p>
      }
    >
      <h2 className="auth-welcome">Create Account ✨</h2>

      <form className="login-form" onSubmit={handleSubmit}>
        {(error || formError) ? <div className="error-banner">{error || formError}</div> : null}

        <label className="field">
          <span>Full name</span>
          <div className="icon-input">
            <User size={16} />
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </label>

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
              placeholder="Create a password"
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

        <label className="field">
          <span>Confirm password</span>
          <div className="icon-input">
            <Lock size={16} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </label>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <>
              Create account <ChevronRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
