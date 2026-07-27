import React, { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import AuthLayout from "../components/AuthLayout";

export default function SignupPage({ onSignup, loading, error, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      <form className="login-form" onSubmit={handleSubmit}>
        {(error || formError) ? <div className="error-banner">{error || formError}</div> : null}

        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            placeholder="Alex Morgan"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

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
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Confirm password</span>
          <input
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
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
