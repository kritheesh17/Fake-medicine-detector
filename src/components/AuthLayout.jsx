import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children, footer }) {
  return (
    <div className="medverify-shell">
      <div className="phone-frame">
        <div className="top-accent" />

        <div className="brand-block">
          <div className="logo-mark" aria-label="MedVerify logo">
            <div className="logo-shield">
              <ShieldCheck size={24} />
            </div>
            <div className="logo-scan" />
          </div>
          <h1>MedVerify</h1>
          <p className="tagline">CDSCO-LINKED DRUG AUTHENTICATION</p>
        </div>

        {children}

        {footer ? <div className="auth-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
