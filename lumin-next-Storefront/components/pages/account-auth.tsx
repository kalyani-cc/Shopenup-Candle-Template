"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginCustomer, signupCustomer } from "@/lib/shopenup/customer";

type Mode = "login" | "signup";

type AccountAuthProps = {
  initialMode: Mode;
  /** Post-auth redirect; only same-origin relative paths allowed. */
  redirectTo?: string;
};

function safeRedirectPath(next: string | undefined): string {
  if (!next || typeof next !== "string") {
    return "/profile";
  }
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) {
    return "/profile";
  }
  return t;
}

export function AccountAuth({ initialMode, redirectTo }: AccountAuthProps) {
  const router = useRouter();
  const afterAuth = safeRedirectPath(redirectTo);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setModeClear = (next: Mode) => {
    setMode(next);
    setError("");
  };

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const result = await loginCustomer({
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      });

      if (!result.ok) {
        if (result.oauthLocation) {
          window.location.href = result.oauthLocation;
          return;
        }
        setError(result.error);
        return;
      }

      router.push(afterAuth);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const result = await signupCustomer({
        first_name: String(form.get("first_name") || ""),
        last_name: String(form.get("last_name") || ""),
        phone: String(form.get("phone") || "").trim(),
        email: String(form.get("email") || ""),
        password: String(form.get("password") || ""),
      });

      if (!result.ok) {
        if (result.oauthLocation) {
          window.location.href = result.oauthLocation;
          return;
        }
        setError(result.error);
        return;
      }

      router.push(afterAuth);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <section className="lumin-auth">
      <div className="lumin-auth__bg" aria-hidden="true" />
      <div className="container-fluid custom-container lumin-auth__container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8 col-sm-10">
            <div className="lumin-auth__card">
              <p className="lumin-auth__eyebrow">Lumin</p>
              <h1 className="lumin-auth__title">{isLogin ? "Sign in" : "Create your account"}</h1>
              <p className="lumin-auth__lead text-muted">
                {isLogin
                  ? "Use your email and password to access your orders and saved details."
                  : "Join to save addresses, track orders, and checkout faster."}
              </p>

              <div className="lumin-auth__segment" role="tablist" aria-label="Account mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  className={`lumin-auth__segment-btn${isLogin ? " is-active" : ""}`}
                  onClick={() => setModeClear("login")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  className={`lumin-auth__segment-btn${!isLogin ? " is-active" : ""}`}
                  onClick={() => setModeClear("signup")}
                >
                  Register
                </button>
              </div>

              <form
                onSubmit={isLogin ? onLogin : onSignup}
                className="lumin-auth__form"
                noValidate={false}
              >
                {!isLogin ? (
                  <>
                    <div className="row g-3 mb-0">
                      <div className="col-sm-6">
                        <label htmlFor="lumin-auth-first" className="lumin-auth__label">
                          First name
                        </label>
                        <input
                          id="lumin-auth-first"
                          name="first_name"
                          autoComplete="given-name"
                          required
                          className="form-control lumin-auth__input"
                          placeholder="Jane"
                        />
                      </div>
                      <div className="col-sm-6">
                        <label htmlFor="lumin-auth-last" className="lumin-auth__label">
                          Last name
                        </label>
                        <input
                          id="lumin-auth-last"
                          name="last_name"
                          autoComplete="family-name"
                          required
                          className="form-control lumin-auth__input"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="lumin-auth__field">
                      <label htmlFor="lumin-auth-phone" className="lumin-auth__label">
                        Phone <span className="text-muted fw-normal">(optional)</span>
                      </label>
                      <input
                        id="lumin-auth-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className="form-control lumin-auth__input"
                        placeholder="+91 …"
                      />
                    </div>
                  </>
                ) : null}

                <div className="lumin-auth__field">
                  <label htmlFor="lumin-auth-email" className="lumin-auth__label">
                    Email
                  </label>
                  <input
                    id="lumin-auth-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-control lumin-auth__input"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="lumin-auth__field">
                  <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                    <label htmlFor="lumin-auth-password" className="lumin-auth__label mb-0">
                      Password
                    </label>
                    {isLogin ? (
                      <Link href="/forgot-password" className="lumin-auth__forgot small">
                        Forgot password?
                      </Link>
                    ) : null}
                  </div>
                  <input
                    id="lumin-auth-password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    minLength={6}
                    required
                    className="form-control lumin-auth__input"
                    placeholder={isLogin ? "Your password" : "At least 6 characters"}
                  />
                </div>

                {error ? (
                  <div className="lumin-auth__error" role="alert">
                    {error}
                  </div>
                ) : null}

                <button type="submit" disabled={loading} className="btn lumin-auth__submit w-100">
                  {loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
                </button>
              </form>

              <p className="lumin-auth__footer text-muted small mb-0">
                {isLogin ? (
                  <>
                    New here?{" "}
                    <button type="button" className="lumin-auth__linkish btn btn-link p-0 align-baseline" onClick={() => setModeClear("signup")}>
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" className="lumin-auth__linkish btn btn-link p-0 align-baseline" onClick={() => setModeClear("login")}>
                      Sign in
                    </button>
                  </>
                )}
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
