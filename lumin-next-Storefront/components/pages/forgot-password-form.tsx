"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestCustomerPasswordReset } from "@/lib/shopenup/customer";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    setError("");
    setMessage("");
    setLoading(true);

    const form = new FormData(formEl);
    const email = String(form.get("email") || "").trim();

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    const result = await requestCustomerPasswordReset(email);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setMessage("If an account exists for that email, we sent a reset link. Check your inbox.");
    formEl.reset();
    setLoading(false);
  };

  return (
    <section className="lumin-auth">
      <div className="lumin-auth__bg" aria-hidden="true" />
      <div className="container-fluid custom-container lumin-auth__container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="lumin-auth__card">
              <p className="lumin-auth__eyebrow">Lumin</p>
              <h1 className="lumin-auth__title">Forgot password</h1>
              <p className="lumin-auth__lead text-muted">
                Enter the email you use for your account. We will send you a link to choose a new password.
              </p>

              <form onSubmit={onSubmit} className="lumin-auth__form">
                <div className="lumin-auth__field">
                  <label htmlFor="lumin-forgot-email" className="lumin-auth__label">
                    Email
                  </label>
                  <input
                    id="lumin-forgot-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-control lumin-auth__input"
                    placeholder="you@example.com"
                  />
                </div>

                {message ? (
                  <div className="lumin-auth__error" style={{ background: "#ecfdf3", borderColor: "#bbf7d0", color: "#14532d" }}>
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div className="lumin-auth__error" role="alert">
                    {error}
                  </div>
                ) : null}

                <button type="submit" disabled={loading} className="btn lumin-auth__submit w-100">
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="lumin-auth__footer text-muted small mb-0">
                <Link href="/login" className="lumin-auth__footer-link">
                  Back to sign in
                </Link>
                {" · "}
                <Link href="/products" className="lumin-auth__footer-link">
                  Continue shopping
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
