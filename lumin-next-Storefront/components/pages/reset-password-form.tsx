"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { resetCustomerPassword } from "@/lib/shopenup/customer";

type ResetPasswordFormProps = {
  initialEmail?: string;
  initialToken?: string;
};

export function ResetPasswordForm({ initialEmail, initialToken }: ResetPasswordFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const email = (initialEmail || "").trim();
  const token = (initialToken || "").trim();
  const hasParams = Boolean(email && token);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!hasParams) {
      setError("This reset link is missing the token or email. Request a new link from the sign-in page.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirm_password") || "");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await resetCustomerPassword({ email, token, password });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setMessage("Your password was updated. Redirecting to sign in…");
    setLoading(false);
    setTimeout(() => {
      router.replace("/login");
    }, 1400);
  };

  return (
    <section className="lumin-auth">
      <div className="lumin-auth__bg" aria-hidden="true" />
      <div className="container-fluid custom-container lumin-auth__container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="lumin-auth__card">
              <p className="lumin-auth__eyebrow">Lumin</p>
              <h1 className="lumin-auth__title">Set a new password</h1>
              {!hasParams ? (
                <p className="lumin-auth__lead text-danger mb-0">
                  This link is invalid or expired. Use “Forgot password” on the sign-in page to get a new one.
                </p>
              ) : (
                <p className="lumin-auth__lead text-muted">
                  Resetting password for <strong className="text-dark">{email}</strong>
                </p>
              )}

              <form onSubmit={onSubmit} className="lumin-auth__form">
                <div className="lumin-auth__field">
                  <label htmlFor="lumin-reset-password" className="lumin-auth__label">
                    New password
                  </label>
                  <input
                    id="lumin-reset-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={!hasParams}
                    className="form-control lumin-auth__input"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="lumin-auth__field">
                  <label htmlFor="lumin-reset-confirm" className="lumin-auth__label">
                    Confirm password
                  </label>
                  <input
                    id="lumin-reset-confirm"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={!hasParams}
                    className="form-control lumin-auth__input"
                    placeholder="Repeat password"
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

                <button type="submit" disabled={loading || !hasParams} className="btn lumin-auth__submit w-100">
                  {loading ? "Saving…" : "Update password"}
                </button>
              </form>

              <p className="lumin-auth__footer text-muted small mb-0">
                <Link href="/login" className="lumin-auth__footer-link">
                  Back to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
