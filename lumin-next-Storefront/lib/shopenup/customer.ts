import { sdk } from "@/lib/config";
import type { StoreCustomer, StoreCustomerAddress } from "@/lib/types/store-customer";
import {
  getAuthHeadersClient,
  getCartId,
  getCompleteHeadersClient,
  removeAuthToken,
  removeCartId,
  setAuthToken
} from "@/lib/shopenup/client-cookies";

export type LoginInput = { email: string; password: string };

export type SignupInput = LoginInput & {
  first_name: string;
  last_name: string;
  phone?: string;
};

export async function getCustomerClient(): Promise<StoreCustomer | null> {
  return sdk.client
    .fetch<{ customer: StoreCustomer }>("/store/customers/me", {
      headers: getCompleteHeadersClient(),
      cache: "no-store",
    })
    .then((r) => r.customer)
    .catch(() => null);
}

/** Saved addresses for the signed-in customer (empty if unauthenticated or none saved). */
export async function listCustomerAddressesClient(): Promise<StoreCustomerAddress[]> {
  if (!("authorization" in getAuthHeadersClient())) {
    return [];
  }
  try {
    const res = await sdk.client.fetch<{ addresses?: StoreCustomerAddress[] }>("/store/customers/me/addresses", {
      method: "GET",
      headers: getCompleteHeadersClient(),
      query: { limit: 50, offset: 0 },
      cache: "no-store",
    });
    const list = res.addresses;
    if (Array.isArray(list) && list.length) {
      return list;
    }
  } catch {
    /* fall through to customer payload */
  }
  try {
    const res = await sdk.client.fetch<{ customer?: StoreCustomer | null }>("/store/customers/me", {
      method: "GET",
      headers: getCompleteHeadersClient(),
      query: {
        fields: "id,addresses.*",
      },
      cache: "no-store",
    });
    const fromCustomer = res.customer?.addresses;
    return Array.isArray(fromCustomer) ? fromCustomer : [];
  } catch {
    return [];
  }
}

export async function loginCustomer(
  input: LoginInput
): Promise<{ ok: true; customer: StoreCustomer | null } | { ok: false; error: string; oauthLocation?: string }> {
  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email: input.email,
      password: input.password,
    });

    if (typeof token === "object" && token !== null && "location" in token) {
      return {
        ok: false,
        error: "Additional sign-in step required.",
        oauthLocation: token.location,
      };
    }

    setAuthToken(token as string);

    const cartId = getCartId();
    if (cartId) {
      try {
        await sdk.store.cart.transferCart(cartId, {}, getCompleteHeadersClient());
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.toLowerCase().includes("cart id not found")) {
          removeCartId();
        }
      }
    }

    const customer = await getCustomerClient();
    return { ok: true, customer };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Sign in failed.",
    };
  }
}

export async function signupCustomer(
  input: SignupInput
): Promise<{ ok: true; customer: StoreCustomer | null } | { ok: false; error: string; oauthLocation?: string }> {
  try {
    const registrationToken = await sdk.auth.register("customer", "emailpass", {
      email: input.email,
      password: input.password,
    });

    await sdk.store.customer.create(
      {
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
      },
      {},
      { authorization: `Bearer ${registrationToken}` }
    );

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: input.email,
      password: input.password,
    });

    if (typeof loginToken === "object" && loginToken !== null && "location" in loginToken) {
      return {
        ok: false,
        error: "Additional sign-in step required.",
        oauthLocation: loginToken.location,
      };
    }

    setAuthToken(loginToken as string);

    const cartId = getCartId();
    if (cartId) {
      try {
        await sdk.store.cart.transferCart(cartId, {}, getCompleteHeadersClient());
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (msg.toLowerCase().includes("cart id not found")) {
          removeCartId();
        }
      }
    }

    const customer = await getCustomerClient();
    return { ok: true, customer };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not create account.",
    };
  }
}

export type UpdateCustomerInput = {
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export async function updateCustomerProfile(
  input: UpdateCustomerInput
): Promise<{ ok: true; customer: StoreCustomer } | { ok: false; error: string }> {
  try {
    const response = await sdk.client.fetch<{ customer: StoreCustomer }>("/store/customers/me", {
      method: "POST",
      headers: getCompleteHeadersClient(),
      body: {
        first_name: input.first_name,
        last_name: input.last_name,
        phone: input.phone,
      },
      cache: "no-store",
    });
    return { ok: true, customer: response.customer };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update profile.",
    };
  }
}

export async function logoutCustomer(): Promise<void> {
  try {
    await sdk.auth.logout();
  } catch {
    /* ignore */
  }
  removeAuthToken();
}

export async function requestCustomerPasswordReset(
  email: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sdk.auth.requestPasswordReset("customer", "emailpass", {
      identifier: email.trim(),
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to request password reset.",
    };
  }
}

export async function resetCustomerPassword(input: {
  email: string;
  token: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sdk.auth.updateProvider("customer", "emailpass", { password: input.password }, input.token);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to reset password.",
    };
  }
}
