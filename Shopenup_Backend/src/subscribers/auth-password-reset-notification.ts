import type { SubscriberArgs, SubscriberConfig } from "@shopenup/shopenup";
import { ContainerRegistrationKeys, Modules } from "@shopenup/framework/utils";
import type { CustomerDTO } from "@shopenup/framework/types";

type PasswordResetPayload = {
  entity_id: string;
  token: string;
  actor_type?: string;
  /** Older payloads used camelCase (see Medusa v2.0.7+ notes). */
  actorType?: string;
};

console.log("✅ [auth-password-reset] Subscriber registered for event: auth.password_reset");

/**
 * For `emailpass`, `entity_id` is the identifier (the customer's email). Medusa sends the
 * notification *to* that address — a separate DB lookup is only for personalization.
 * A strict `query.graph({ filters: { email }})` often returns no rows, so we used to bail
 * with `if (!customer?.email) return` and never sent mail.
 */
export default async function sendPasswordResetNotification({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetPayload>) {
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const notificationModuleService = container.resolve(Modules.NOTIFICATION);

    const actor = String(data.actor_type ?? data.actorType ?? "").toLowerCase();
    const isCustomer = actor === "customer" || actor === "logged-in-customer";

    const toEmail = String(data.entity_id || "")
      .trim()
      .toLowerCase();
    if (!toEmail || !toEmail.includes("@")) {
      console.warn("[auth-password-reset] Invalid entity_id (expected email for emailpass):", data.entity_id);
      return;
    }

    let firstName = toEmail.split("@")[0] || "there";
    let customerForTemplate: Pick<CustomerDTO, "id" | "email" | "first_name" | "last_name"> = {
      id: "",
      email: toEmail,
      first_name: firstName,
      last_name: "",
    };

    if (isCustomer) {
      try {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "email", "first_name", "last_name"],
          filters: { email: toEmail },
        });
        const c = customers?.[0] as CustomerDTO | undefined;
        if (c?.email) {
          customerForTemplate = {
            id: c.id,
            email: c.email,
            first_name: c.first_name || firstName,
            last_name: c.last_name || "",
          };
          if (c.first_name?.trim()) {
            firstName = c.first_name.trim();
          }
        }
      } catch (e) {
        console.warn("[auth-password-reset] Optional customer lookup failed (still sending email):", e);
      }
    } else {
      try {
        const { data: users } = await query.graph({
          entity: "user",
          fields: ["id", "email", "first_name", "last_name"],
          filters: { email: toEmail },
        });
        const u = users?.[0] as CustomerDTO | undefined;
        if (u?.email) {
          customerForTemplate = {
            id: u.id,
            email: u.email,
            first_name: u.first_name || firstName,
            last_name: u.last_name || "",
          };
          if (u.first_name?.trim()) {
            firstName = u.first_name.trim();
          }
        }
      } catch (e) {
        console.warn("[auth-password-reset] Optional user lookup failed (still sending email):", e);
      }
    }

    const config = container.resolve("configModule") as {
      admin?: { storefrontUrl?: string; backendUrl?: string; path?: string };
    };

    const backendBase =
      config.admin?.backendUrl && config.admin.backendUrl !== "/"
        ? String(config.admin.backendUrl).replace(/[,\/\s]+$/, "").trim()
        : (process.env.BACKEND_URL || "http://localhost:9000").replace(/[,\/\s]+$/, "").trim();
    const adminPath = config.admin?.path ?? "/app";

    const storefront = String(config.admin?.storefrontUrl || process.env.STOREFRONT_URL || "")
      .replace(/[,\/\s]+$/, "")
      .trim();

    const baseUrl = isCustomer ? storefront : `${backendBase}${adminPath}`;
    let urlBase = baseUrl.replace(/\/+$/, "");
    if (!urlBase) {
      urlBase = (process.env.STOREFRONT_URL || "").replace(/[,\/\s]+$/, "").trim();
    }
    if (!urlBase && !isCustomer) {
      urlBase = `${backendBase}${adminPath}`.replace(/\/+$/, "");
    }
    if (!urlBase) {
      console.error(
        "[auth-password-reset] Cannot build reset link: set STOREFRONT_URL (customers) or BACKEND_URL (admin)."
      );
      return;
    }

    const resetUrl = `${urlBase}/reset-password?email=${encodeURIComponent(toEmail)}&token=${encodeURIComponent(data.token)}`;
    const subject = `Reset your password, ${firstName}`;

    await notificationModuleService.createNotifications({
      to: toEmail,
      channel: "email",
      template: "auth-password-reset",
      data: {
        subject,
        customer: customerForTemplate,
        store_name: process.env.STORE_NAME || "Store",
        store_url: resetUrl,
      },
    });

    console.log(`[auth-password-reset] Sent password reset email to ${toEmail}`);
  } catch (error) {
    console.error("Error in password reset notification handler:", error);
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
