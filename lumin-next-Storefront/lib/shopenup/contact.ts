import { sdk } from "@/lib/config";
import { getCompleteHeadersClient } from "@/lib/shopenup/client-cookies";

export type ContactFormInput = {
  email: string;
  name: string;
  message: string;
  phone?: string;
  subject?: string;
};

export type NewsletterSubscriptionInput = {
  email: string;
  name?: string;
};

/**
 * Storefront contact → Shopenup `POST /store/custom/contact`
 * (emits `contact_form.submitted` when message is non-empty).
 */
export async function submitContactForm(
  input: ContactFormInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim();
  const message = input.message.trim();
  if (!email) {
    return { ok: false, error: "Email is required." };
  }
  if (!message) {
    return { ok: false, error: "Please enter a message." };
  }

  try {
    await sdk.client.fetch<{ success?: boolean }>("/store/custom/contact", {
      method: "POST",
      headers: getCompleteHeadersClient(),
      body: {
        email,
        name: input.name.trim() || "Website visitor",
        message,
        phone: input.phone?.trim() || undefined,
        subject: input.subject?.trim() || undefined,
      },
      cache: "no-store",
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send your message.",
    };
  }
}

/**
 * Storefront newsletter subscribe → Shopenup `POST /store/custom/contact`
 * (emits `newsletter.subscribed` when message is empty).
 */
export async function subscribeToNewsletter(
  input: NewsletterSubscriptionInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim();
  if (!email) {
    return { ok: false, error: "Email is required." };
  }

  try {
    await sdk.client.fetch<{ success?: boolean }>("/store/custom/contact", {
      method: "POST",
      headers: getCompleteHeadersClient(),
      body: {
        email,
        name: input.name?.trim() || "Subscriber",
      },
      cache: "no-store",
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not subscribe right now.",
    };
  }
}
