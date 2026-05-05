"use client";

import { FormEvent, useState } from "react";
import { subscribeToNewsletter } from "@/lib/shopenup/contact";

function toast(message: string, type: "success" | "info" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("lumin_next:toast", { detail: { message, type } }));
}

export function FooterNewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) {
      return;
    }
    const value = email.trim();
    if (!value) {
      toast("Please enter your email.", "error");
      return;
    }

    setSubmitting(true);
    const result = await subscribeToNewsletter({ email: value });
    setSubmitting(false);

    if (!result.ok) {
      toast(result.error, "error");
      return;
    }

    setEmail("");
    toast("Subscribed successfully. Welcome!", "success");
  };

  return (
    <form onSubmit={onSubmit} className="d-flex flex-column gap-2" noValidate>
      <input
        type="email"
        placeholder="Email address..."
        className="form-control bg-dark text-white border-secondary"
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" className="btn btn-outline-light align-self-start" disabled={submitting}>
        {submitting ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );
}
