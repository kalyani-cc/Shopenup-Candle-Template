"use client";

import { useEffect } from "react";
import {
  addShippingMethod,
  completeCart,
  getCartLineThumbnail,
  listPaymentProviders,
  listShippingOptions,
  retrieveCart,
  setPaymentSession,
  updateCart,
  type StoreCart
} from "@/lib/shopenup/cart";
import { formatCurrency } from "@/lib/utils";

const COUNTRY_OPTIONS = [
  { code: "in", label: "India" },
  { code: "us", label: "United States" }
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "District of Columbia"
];

function getStatesByCountry(countryCode: string): string[] {
  return countryCode === "us" ? US_STATES : INDIAN_STATES;
}

function toast(message: string, type: "success" | "info" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("lumin_next:toast", { detail: { message, type } }));
}

function lineTotal(item: NonNullable<StoreCart["items"]>[number]) {
  return item.total ?? item.subtotal ?? (item.unit_price || 0) * (item.quantity || 1);
}

function setText(el: Element | null, value: string) {
  if (el) el.textContent = value;
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/\n/g, " ");
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function findNestedValue(input: unknown, keys: Set<string>): unknown {
  const seen = new WeakSet<object>();
  const queue: unknown[] = [input];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);
    const rec = current as Record<string, unknown>;
    for (const [k, v] of Object.entries(rec)) {
      if (keys.has(k) && v != null) {
        return v;
      }
      if (v && typeof v === "object") {
        queue.push(v);
      }
    }
  }
  return undefined;
}

function getRazorpayCheckoutConfig(cart: StoreCart | null): {
  orderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
} | null {
  if (!cart) return null;
  const orderId = String(findNestedValue(cart, new Set(["razorpay_order_id", "order_id"])) || "").trim();
  const keyId = String(findNestedValue(cart, new Set(["razorpay_key_id", "key_id"])) || "").trim();
  const amountRaw = Number(findNestedValue(cart, new Set(["amount", "razorpay_amount"])) ?? 0);
  const amountPaise = amountRaw > 0 ? Math.round(amountRaw) : Math.round((cart.total || 0) * 100);
  const currencyRaw = String(
    findNestedValue(cart, new Set(["currency", "currency_code"])) || cart.currency_code || "INR"
  ).trim();
  const currency = (currencyRaw || "INR").toUpperCase();
  if (!orderId || !keyId || !amountPaise) {
    return null;
  }
  return { orderId, keyId, amountPaise, currency };
}

function getInputByLabel(root: ParentNode, labelPart: string): HTMLInputElement | null {
  const labels = Array.from(root.querySelectorAll("label.single-form__label"));
  const match = labels.find((l) => (l.textContent || "").toLowerCase().includes(labelPart.toLowerCase()));
  if (!match) return null;
  return match.parentElement?.querySelector("input.single-form__input") ?? null;
}

function getInputByAnyLabel(root: ParentNode, labelParts: string[]): HTMLInputElement | null {
  for (const part of labelParts) {
    const input = getInputByLabel(root, part);
    if (input) return input;
  }
  return null;
}

function getSelectByLabel(root: ParentNode, labelPart: string): HTMLSelectElement | null {
  const labels = Array.from(root.querySelectorAll("label.single-form__label"));
  const match = labels.find((l) => (l.textContent || "").toLowerCase().includes(labelPart.toLowerCase()));
  if (!match) return null;
  return match.parentElement?.querySelector("select") ?? null;
}

function forceNativeSelect(select: HTMLSelectElement | null) {
  if (!select) return;
  const form = select.closest(".single-form");
  form?.querySelectorAll(".nice-select").forEach((node) => node.remove());
  select.classList.remove("select2");
  select.style.display = "block";
  select.style.width = "100%";
}

export function CheckoutTemplateClient() {
  useEffect(() => {
    const checkoutRoot = document.querySelector(".checkout-section");
    if (!checkoutRoot) return;

    const orderTable = checkoutRoot.querySelector(".checkout-details__order-review table");
    const tbody = orderTable?.querySelector("tbody");
    const subtotalCell = (orderTable?.querySelector(".cart-subtotal td span") || null) as Element | null;
    const totalCell = (orderTable?.querySelector(".order-total td strong span") || null) as Element | null;
    const shippingCell = orderTable?.querySelector(".cart-shipping td[data-title='Shipping']") as Element | null;
    const paymentWrap = checkoutRoot.querySelector(".checkout-details__payment-method .accordion");
    const placeOrderBtn = checkoutRoot.querySelector(".checkout-details__btn .btn") as HTMLButtonElement | null;
    const couponInput = checkoutRoot.querySelector(".checkout-coupon-form input") as HTMLInputElement | null;
    const couponApplyBtn = checkoutRoot.querySelector(".checkout-coupon-form button") as HTMLButtonElement | null;

    if (!tbody || !placeOrderBtn || !shippingCell || !paymentWrap) return;

    const status = document.createElement("p");
    status.style.marginTop = "12px";
    status.style.fontSize = "14px";
    status.style.color = "#b84545";
    placeOrderBtn.parentElement?.appendChild(status);

    let currentCart: StoreCart | null = null;
    let shippingOptions: Array<{ id: string; name?: string; amount?: number; price_type?: string }> = [];
    let paymentProviders: Array<{ id: string }> = [];
    let selectedShippingId = "";
    let selectedPaymentId = "";
    let busy = false;

    const setBusy = (value: boolean) => {
      busy = value;
      placeOrderBtn.disabled = value;
      placeOrderBtn.textContent = value ? "Processing..." : "Place Order";
      if (couponApplyBtn) {
        couponApplyBtn.disabled = value;
      }
    };

    const syncCheckoutSummaryRows = (cart: StoreCart | null) => {
      const tfoot = orderTable?.querySelector("tfoot");
      const orderTotalRow = tfoot?.querySelector("tr.order-total");
      if (!tfoot || !orderTotalRow) return;
      tfoot.querySelectorAll("tr[data-lumin-checkout-summary]").forEach((r) => r.remove());
      if (!cart?.items?.length) return;

      const codes =
        cart.promotions
          ?.map((p) => p.code?.trim())
          .filter((c): c is string => Boolean(c)) ?? [];
      if (codes.length) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-lumin-checkout-summary", "1");
        tr.innerHTML = `<th>Promo code${codes.length > 1 ? "s" : ""}</th><td><span>${escapeHtml(codes.join(", "))}</span></td>`;
        orderTotalRow.parentNode?.insertBefore(tr, orderTotalRow);
      }
      const disc = cart.discount_total ?? 0;
      if (disc > 0) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-lumin-checkout-summary", "1");
        tr.innerHTML = `<th>Discount</th><td><span>−${escapeHtml(formatCurrency(disc))}</span></td>`;
        orderTotalRow.parentNode?.insertBefore(tr, orderTotalRow);
      }
      const tax = cart.tax_total ?? 0;
      if (tax > 0) {
        const tr = document.createElement("tr");
        tr.setAttribute("data-lumin-checkout-summary", "1");
        tr.innerHTML = `<th>Tax</th><td><span>${escapeHtml(formatCurrency(tax))}</span></td>`;
        orderTotalRow.parentNode?.insertBefore(tr, orderTotalRow);
      }
    };

    const renderCart = (cart: StoreCart | null) => {
      currentCart = cart;
      if (!cart?.items?.length) {
        tbody.innerHTML = `<tr><td class="product-name">No items in cart.</td><td class="product-total"><span>${formatCurrency(
          0
        )}</span></td></tr>`;
        setText(subtotalCell, formatCurrency(0));
        setText(totalCell, formatCurrency(0));
        syncCheckoutSummaryRows(null);
        return;
      }

      tbody.innerHTML = cart.items
        .map((item) => {
          const title = item.title || item.product_title || "Item";
          const qty = item.quantity || 1;
          const thumb = getCartLineThumbnail(item);
          const safeTitle = escapeHtml(title);
          const thumbBlock = thumb
            ? `<span class="lumin-checkout-line__thumb"><img src="${escapeAttr(
                thumb
              )}" alt="${escapeAttr(title)}" width="52" height="52" loading="lazy" decoding="async" /></span>`
            : `<span class="lumin-checkout-line__thumb lumin-checkout-line__thumb--empty" aria-hidden="true"></span>`;
          return `<tr class="cart-item"><td class="product-name"><div class="lumin-checkout-line">${thumbBlock}<span class="lumin-checkout-line__text">${safeTitle}&nbsp;<strong>×&nbsp;${qty}</strong></span></div></td><td class="product-total"><span>${formatCurrency(
            lineTotal(item)
          )}</span></td></tr>`;
        })
        .join("");

      const subtotal =
        cart.subtotal ??
        cart.items.reduce((sum, item) => {
          return sum + lineTotal(item);
        }, 0);

      const total = cart.total ?? Math.max(0, subtotal + (cart.tax_total || 0) + (cart.shipping_total || 0) - (cart.discount_total || 0));
      setText(subtotalCell, formatCurrency(subtotal));
      setText(totalCell, formatCurrency(total));
      syncCheckoutSummaryRows(cart);
    };

    const renderShipping = () => {
      if (!shippingOptions.length) {
        shippingCell.innerHTML = `<span>No shipping options available.</span>`;
        return;
      }

      shippingCell.innerHTML = `<form action="#"><ul class="shipping-methods">${shippingOptions
        .map((option, index) => {
          const id = `ship-${option.id}`;
          const checked = index === 0 ? "checked" : "";
          return `<li class="single-form"><input type="radio" name="shippingMethod" id="${id}" data-option-id="${
            option.id
          }" ${checked} /><label for="${id}" class="single-form__label radio-label"><span></span>${option.name || "Shipping"}${
            typeof option.amount === "number" ? `: <strong class="price">${formatCurrency(option.amount)}</strong>` : ""
          }</label></li>`;
        })
        .join("")}</ul></form>`;

      const selected = shippingCell.querySelector("input[name='shippingMethod']:checked") as HTMLInputElement | null;
      selectedShippingId = selected?.dataset.optionId || shippingOptions[0]?.id || "";

      shippingCell.querySelectorAll("input[name='shippingMethod']").forEach((radio) => {
        radio.addEventListener("change", async (event) => {
          const target = event.currentTarget as HTMLInputElement;
          const optionId = target.dataset.optionId || "";
          if (!optionId || busy) return;
          selectedShippingId = optionId;
          try {
            setBusy(true);
            status.textContent = "";
            const selectedOption = shippingOptions.find((opt) => opt.id === optionId);
            const updated = await addShippingMethod(
              optionId,
              selectedOption?.price_type === "calculated" ? { shipping_option_id: optionId } : undefined
            );
            renderCart(updated);
            toast("Shipping method applied");
          } catch (e) {
            status.textContent = e instanceof Error ? e.message : "Failed to apply shipping method.";
            toast(status.textContent, "error");
          } finally {
            setBusy(false);
          }
        });
      });
    };

    const renderPayments = () => {
      if (!paymentProviders.length) {
        paymentWrap.innerHTML = `<form action="#"><p class="small">No payment providers available.</p></form>`;
        return;
      }
      paymentWrap.innerHTML = `<form action="#">${paymentProviders
        .map((provider, index) => {
          const id = `pay-${provider.id}`;
          const checked = index === 0 ? "checked" : "";
          return `<div class="accordion-item"><div class="single-form"><input type="radio" name="payment-method" id="${id}" data-provider-id="${provider.id}" ${checked} /><label for="${id}" class="single-form__label radio-label"><span></span>${provider.id}</label></div></div>`;
        })
        .join("")}</form>`;
      const selected = paymentWrap.querySelector("input[name='payment-method']:checked") as HTMLInputElement | null;
      selectedPaymentId = selected?.dataset.providerId || paymentProviders[0]?.id || "";
    };

    const billingRoot = checkoutRoot.querySelector(".checkout-details__billing") as ParentNode;
    const countrySelect =
      getSelectByLabel(billingRoot, "country") ||
      ((billingRoot.querySelector("select.single-form__select") as HTMLSelectElement | null) || null);
    const stateInput = getInputByAnyLabel(billingRoot, ["state", "province"]);
    let stateSelect = (billingRoot.querySelector("#lumin-checkout-state") as HTMLSelectElement | null) || null;

    const ensureStateSelect = () => {
      if (stateSelect) {
        forceNativeSelect(stateSelect);
        return stateSelect;
      }

      const existingStateSelect = getSelectByLabel(billingRoot, "state") || getSelectByLabel(billingRoot, "province");
      if (existingStateSelect) {
        stateSelect = existingStateSelect;
        forceNativeSelect(stateSelect);
        return stateSelect;
      }

      if (stateInput?.parentElement) {
        stateInput.style.display = "none";
        const select = document.createElement("select");
        select.id = "lumin-checkout-state";
        select.className = "single-form__select";
        stateInput.parentElement.appendChild(select);
        stateSelect = select;
        forceNativeSelect(stateSelect);
        return select;
      }

      const cityInput = getInputByAnyLabel(billingRoot, ["town / city", "city", "suburb"]);
      const cityForm = cityInput?.closest(".single-form");
      if (!cityForm?.parentElement) {
        return null;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "single-form";
      wrapper.innerHTML = `<label class="single-form__label">State *</label><select id="lumin-checkout-state" class="single-form__select"></select>`;
      cityForm.parentElement.insertBefore(wrapper, cityForm.nextSibling);
      stateSelect = wrapper.querySelector("#lumin-checkout-state") as HTMLSelectElement | null;
      forceNativeSelect(stateSelect);
      return stateSelect;
    };

    const populateStateOptions = (countryCode: string) => {
      const select = ensureStateSelect();
      if (!select) {
        return;
      }
      const states = getStatesByCountry(countryCode);
      select.innerHTML = states.map((state) => `<option value="${state}">${state}</option>`).join("");
      if (!select.value && states.length) {
        select.value = states[0];
      }
    };

    if (countrySelect) {
      forceNativeSelect(countrySelect);
      countrySelect.innerHTML = COUNTRY_OPTIONS.map(
        (country) => `<option value="${country.code}">${country.label}</option>`
      ).join("");
      countrySelect.value = "in";
      countrySelect.addEventListener("change", () => {
        populateStateOptions(countrySelect.value || "in");
      });
      populateStateOptions(countrySelect.value || "in");
    } else {
      populateStateOptions("in");
    }

    const load = async () => {
      try {
        const cart = await retrieveCart();
        renderCart(cart);
        if (!cart?.items?.length) {
          status.textContent = "Your cart is empty. Add products before checkout.";
          return;
        }
        shippingOptions = await listShippingOptions();
        renderShipping();
        paymentProviders = await listPaymentProviders(cart.region_id);
        renderPayments();
      } catch (e) {
        status.textContent = e instanceof Error ? e.message : "Failed to load checkout.";
      }
    };

    const onCouponApply = async (event: Event) => {
      event.preventDefault();
      const code = couponInput?.value?.trim();
      if (!code) {
        status.textContent = "Please enter coupon code.";
        return;
      }
      try {
        setBusy(true);
        status.textContent = "";
        const existingCodes = (currentCart?.promotions || [])
          .map((promotion) => promotion.code)
          .filter((value): value is string => Boolean(value));
        const updated = await updateCart({ promo_codes: [...existingCodes, code] });
        renderCart(updated);
        if (couponInput) couponInput.value = "";
        toast("Coupon applied");
      } catch (e) {
        status.textContent = e instanceof Error ? e.message : "Failed to apply coupon.";
        toast(status.textContent, "error");
      } finally {
        setBusy(false);
      }
    };

    const onPlaceOrder = async (event: Event) => {
      event.preventDefault();
      if (busy) return;
      if (!currentCart?.items?.length) {
        status.textContent = "Your cart is empty.";
        return;
      }
      try {
        setBusy(true);
        status.textContent = "";

        const firstName = getInputByAnyLabel(billingRoot, ["first name"])?.value?.trim() || "";
        const lastName = getInputByAnyLabel(billingRoot, ["last name"])?.value?.trim() || "";
        const address = getInputByAnyLabel(billingRoot, ["street address", "address"])?.value?.trim() || "";
        const city =
          getInputByAnyLabel(billingRoot, ["town / city", "city", "suburb"])?.value?.trim() || "";
        const postal = getInputByAnyLabel(billingRoot, ["post code", "postcode", "postal"])?.value?.trim() || "";
        const phone = getInputByLabel(billingRoot, "phone")?.value?.trim() || "";
        const email = getInputByLabel(billingRoot, "email")?.value?.trim() || "";
        const countryCode = countrySelect?.value || "in";
        const stateValue = stateSelect?.value?.trim() || stateInput?.value?.trim() || "";

        if (!firstName || !lastName || !address || !city || !postal || !phone || !email || !stateValue) {
          status.textContent = "Please fill all required billing details.";
          return;
        }

        const promoCodesToKeep = (currentCart?.promotions || [])
          .map((p) => p.code?.trim())
          .filter((c): c is string => Boolean(c));

        const updatedCart = await updateCart({
          email,
          shipping_address: {
            first_name: firstName,
            last_name: lastName,
            address_1: address,
            city,
            postal_code: postal,
            phone,
            province: stateValue,
            country_code: countryCode
          },
          billing_address: {
            first_name: firstName,
            last_name: lastName,
            address_1: address,
            city,
            postal_code: postal,
            phone,
            province: stateValue,
            country_code: countryCode
          },
          ...(promoCodesToKeep.length ? { promo_codes: promoCodesToKeep } : {})
        });
        renderCart(updatedCart);

        if (!selectedShippingId) {
          const selectedShipInput = shippingCell.querySelector("input[name='shippingMethod']:checked") as HTMLInputElement | null;
          selectedShippingId = selectedShipInput?.dataset.optionId || shippingOptions[0]?.id || "";
        }
        if (selectedShippingId) {
          const selectedOption = shippingOptions.find((opt) => opt.id === selectedShippingId);
          const cartAfterShipping = await addShippingMethod(
            selectedShippingId,
            selectedOption?.price_type === "calculated" ? { shipping_option_id: selectedShippingId } : undefined
          );
          renderCart(cartAfterShipping);
        }

        const selectedPayInput = paymentWrap.querySelector("input[name='payment-method']:checked") as HTMLInputElement | null;
        selectedPaymentId = selectedPayInput?.dataset.providerId || selectedPaymentId || paymentProviders[0]?.id || "";
        if (!selectedPaymentId) {
          throw new Error("No payment method available for this cart.");
        }
        const cartAfterPayment = await setPaymentSession(selectedPaymentId);
        renderCart(cartAfterPayment);

        if (/razorpay/i.test(selectedPaymentId)) {
          const loaded = await loadRazorpayScript();
          if (!loaded || !(window as any).Razorpay) {
            throw new Error("Unable to load Razorpay checkout.");
          }

          const latestCart = await retrieveCart();
          const razorpayCart = latestCart || cartAfterPayment;
          const cfg = getRazorpayCheckoutConfig(razorpayCart);
          if (!cfg) {
            throw new Error("Razorpay session data is missing. Please try again.");
          }

          const email = getInputByLabel(billingRoot, "email")?.value?.trim() || "";
          const contact = getInputByLabel(billingRoot, "phone")?.value?.trim() || "";
          const first = getInputByAnyLabel(billingRoot, ["first name"])?.value?.trim() || "";
          const last = getInputByAnyLabel(billingRoot, ["last name"])?.value?.trim() || "";
          const customerName = [first, last].filter(Boolean).join(" ").trim();

          await new Promise<void>((resolve, reject) => {
            const rzp = new (window as any).Razorpay({
              key: cfg.keyId,
              amount: cfg.amountPaise,
              currency: cfg.currency,
              order_id: cfg.orderId,
              name: "Lumin",
              description: "Order payment",
              prefill: {
                name: customerName || undefined,
                email: email || undefined,
                contact: contact || undefined
              },
              handler: () => resolve(),
              modal: {
                ondismiss: () => reject(new Error("Payment cancelled by user."))
              }
            });
            rzp.open();
          });
        }

        const result = await completeCart();
        const orderId = result?.order?.id;
        window.location.href = orderId ? `/order-confirm?order_id=${encodeURIComponent(orderId)}` : "/order-confirm";
      } catch (e) {
        status.textContent = e instanceof Error ? e.message : "Failed to place order.";
        toast(status.textContent, "error");
      } finally {
        setBusy(false);
      }
    };

    load().catch(() => null);
    placeOrderBtn.addEventListener("click", onPlaceOrder);
    couponApplyBtn?.addEventListener("click", onCouponApply);

    return () => {
      placeOrderBtn.removeEventListener("click", onPlaceOrder);
      couponApplyBtn?.removeEventListener("click", onCouponApply);
    };
  }, []);

  return null;
}
