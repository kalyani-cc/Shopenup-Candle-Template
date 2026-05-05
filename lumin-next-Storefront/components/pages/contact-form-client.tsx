"use client";

import { useEffect } from "react";
import { submitContactForm } from "@/lib/shopenup/contact";

function toast(message: string, type: "success" | "info" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("lumin_next:toast", { detail: { message, type } }));
}

export function ContactFormClient() {
  useEffect(() => {
    const form =
      (document.getElementById("lumin-contact-form") as HTMLFormElement | null) ||
      (document.querySelector(".contact-us-form form") as HTMLFormElement | null);
    if (!form) {
      return undefined;
    }

    const getVal = (selector: string) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
      return el?.value?.trim() ?? "";
    };

    const onSubmit = async (event: Event) => {
      event.preventDefault();
      if (!form.reportValidity()) {
        return;
      }
      const first = getVal('[name="first_name"]');
      const last = getVal('[name="last_name"]');
      const name = [first, last].filter(Boolean).join(" ").trim() || "Website visitor";
      const email = getVal('[name="email"]');
      const phone = getVal('[name="phone"]');
      const message = getVal('[name="message"]');

      const result = await submitContactForm({ name, email, message, phone });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      toast("Thanks — your message was sent.");
      form.reset();
    };

    form.addEventListener("submit", onSubmit);

    return () => {
      form.removeEventListener("submit", onSubmit);
    };
  }, []);

  return null;
}
