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

function normalizeAddressPayload(input: CustomerAddressInput): Record<string, unknown> {
  return {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    company: input.company?.trim() || undefined,
    address_1: input.address_1.trim(),
    address_2: input.address_2?.trim() || undefined,
    city: input.city.trim(),
    postal_code: input.postal_code.trim(),
    province: input.province?.trim() || undefined,
    country_code: input.country_code.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    ...(input.is_default_billing != null ? { is_default_billing: input.is_default_billing } : {}),
    ...(input.is_default_shipping != null ? { is_default_shipping: input.is_default_shipping } : {}),
  };
}

export async function createCustomerAddressClient(
  input: CustomerAddressInput
): Promise<{ ok: true; address: StoreCustomerAddress } | { ok: false; error: string }> {
  if (!("authorization" in getAuthHeadersClient())) {
    return { ok: false, error: "Sign in to save an address." };
  }
  try {
    const res = await sdk.client.fetch<{ address: StoreCustomerAddress }>("/store/customers/me/addresses", {
      method: "POST",
      headers: getCompleteHeadersClient(),
      body: normalizeAddressPayload(input),
      cache: "no-store",
    });
    if (!res?.address?.id) {
      return { ok: false, error: "Address was not saved." };
    }
    return { ok: true, address: res.address };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save address.",
    };
  }
}

export async function updateCustomerAddressClient(
  addressId: string,
  input: Partial<CustomerAddressInput>
): Promise<{ ok: true; address: StoreCustomerAddress } | { ok: false; error: string }> {
  if (!addressId) {
    return { ok: false, error: "Invalid address." };
  }
  if (!("authorization" in getAuthHeadersClient())) {
    return { ok: false, error: "Sign in to update an address." };
  }
  try {
    const body: Record<string, unknown> = {};
    if (input.first_name != null) body.first_name = input.first_name.trim();
    if (input.last_name != null) body.last_name = input.last_name.trim();
    if (input.company !== undefined) body.company = input.company?.trim() || undefined;
    if (input.address_1 != null) body.address_1 = input.address_1.trim();
    if (input.address_2 !== undefined) body.address_2 = input.address_2?.trim() || undefined;
    if (input.city != null) body.city = input.city.trim();
    if (input.postal_code != null) body.postal_code = input.postal_code.trim();
    if (input.province !== undefined) body.province = input.province?.trim() || undefined;
    if (input.country_code != null) body.country_code = input.country_code.trim().toLowerCase();
    if (input.phone !== undefined) body.phone = input.phone?.trim() || undefined;
    if (input.is_default_billing != null) body.is_default_billing = input.is_default_billing;
    if (input.is_default_shipping != null) body.is_default_shipping = input.is_default_shipping;

    const res = await sdk.client.fetch<{ address: StoreCustomerAddress }>(
      `/store/customers/me/addresses/${addressId}`,
      {
        method: "POST",
        headers: getCompleteHeadersClient(),
        body,
        cache: "no-store",
      }
    );
    if (!res?.address?.id) {
      return { ok: false, error: "Address was not updated." };
    }
    return { ok: true, address: res.address };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update address.",
    };
  }
}

export async function deleteCustomerAddressClient(
  addressId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!addressId) {
    return { ok: false, error: "Invalid address." };
  }
  if (!("authorization" in getAuthHeadersClient())) {
    return { ok: false, error: "Sign in to delete an address." };
  }
  try {
    await sdk.client.fetch(`/store/customers/me/addresses/${addressId}`, {
      method: "DELETE",
      headers: getCompleteHeadersClient(),
      cache: "no-store",
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to delete address.",
    };
  }
}

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
export type CustomerAddressInput = {
  first_name: string;
  last_name: string;
  company?: string | null;
  address_1: string;
  address_2?: string | null;
  city: string;
  postal_code: string;
  province?: string | null;
  country_code: string;
  phone?: string | null;
  is_default_billing?: boolean;
  is_default_shipping?: boolean;
};

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
