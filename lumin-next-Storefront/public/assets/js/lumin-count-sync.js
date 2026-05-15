(function () {
  var WISHLIST_KEY = "lumin_next_guest_wishlist";
  var JWT_COOKIE = "_shopenup_jwt";
  var CART_COOKIE = "_shopenup_cart_id";
  var CART_LEGACY_KEY = "lumin_next_cart_id";

  function readCookie(name) {
    var escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    var match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function getBackendUrl() {
    var body = document.body;
    var fromData = body ? body.getAttribute("data-backend-url") : "";
    return (fromData || "http://localhost:9000").replace(/\/+$/, "");
  }

  function getPublishableKey() {
    var body = document.body;
    return (body ? body.getAttribute("data-publishable-key") : "") || "";
  }

  function getCartId() {
    var fromCookie = readCookie(CART_COOKIE);
    if (fromCookie) return fromCookie;
    try {
      return window.localStorage.getItem(CART_LEGACY_KEY) || "";
    } catch (_e) {
      return "";
    }
  }

  function getAuthToken() {
    return readCookie(JWT_COOKIE);
  }

  function getGuestWishlistCount() {
    try {
      var raw = window.localStorage.getItem(WISHLIST_KEY);
      if (!raw) return 0;
      var items = JSON.parse(raw);
      return Array.isArray(items) ? items.length : 0;
    } catch (_e) {
      return 0;
    }
  }

  async function fetchWishlistCount() {
    var token = getAuthToken();
    if (!token) {
      return getGuestWishlistCount();
    }
    var backend = getBackendUrl();
    var publishableKey = getPublishableKey();
    var headers = {
      authorization: "Bearer " + token
    };
    if (publishableKey) {
      headers["x-publishable-api-key"] = publishableKey;
    }
    try {
      var response = await fetch(backend + "/store/customers/me/wishlists", {
        method: "GET",
        headers: headers,
        credentials: "include",
        cache: "no-store"
      });
      if (!response.ok) return 0;
      var payload = await response.json();
      var items = payload && payload.wishlist && Array.isArray(payload.wishlist.items) ? payload.wishlist.items : [];
      return items.length;
    } catch (_e) {
      return getGuestWishlistCount();
    }
  }

  function setBadgeText(span, count) {
    if (!span) return;
    span.textContent = count > 0 ? String(count) : "";
    span.style.display = count > 0 ? "inline-flex" : "none";
  }

  function updateWishlistBadges(count) {
    var selectors = [
      "li.wishlist .badge",
      "a[aria-label='Wishlist'] .badge",
      "a[aria-label='wishlist'] .badge",
      "a[href='/wishlist'] .badge",
      "a[href='wishlist.html'] .badge"
    ];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        setBadgeText(el, count);
      });
    });
  }

  function updateCartBadges(count) {
    var selectors = [
      "li.cart .badge",
      "a[aria-label='Cart'] .badge",
      "a[aria-label='cart'] .badge",
      "button[aria-label='Cart'] .badge",
      "button[aria-label='cart'] .badge",
      "a[href='/cart'] .badge"
    ];
    selectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        setBadgeText(el, count);
      });
    });
  }

  async function fetchCartCount() {
    var cartId = getCartId();
    if (!cartId) return 0;
    var backend = getBackendUrl();
    var publishableKey = getPublishableKey();
    var headers = {};
    if (publishableKey) {
      headers["x-publishable-api-key"] = publishableKey;
    }
    try {
      var response = await fetch(backend + "/store/carts/" + encodeURIComponent(cartId), {
        method: "GET",
        headers: headers,
        credentials: "include",
        cache: "no-store"
      });
      if (!response.ok) return 0;
      var payload = await response.json();
      var items = payload && payload.cart && Array.isArray(payload.cart.items) ? payload.cart.items : [];
      return items.reduce(function (sum, item) {
        var qty = Number(item && item.quantity ? item.quantity : 0);
        return sum + (isFinite(qty) ? Math.max(0, qty) : 0);
      }, 0);
    } catch (_e) {
      return 0;
    }
  }

  async function syncCounts() {
    updateWishlistBadges(await fetchWishlistCount());
    updateCartBadges(await fetchCartCount());
  }

  function bindEvents() {
    window.addEventListener("lumin_next:wishlist_changed", function () {
      void syncCounts();
    });
    window.addEventListener("lumin_next:cart_changed", function () {
      void syncCounts();
    });
    window.addEventListener("storage", function (event) {
      if (!event) return;
      if (event.key === WISHLIST_KEY || event.key === CART_LEGACY_KEY) {
        void syncCounts();
      }
    });
  }

  /**
   * Defer first badge paint until after React has hydrated the navbar.
   * If `syncCounts` runs while readyState is already "complete", it can mutate
   * `.badge` spans before hydration and trigger "Text content does not match server-rendered HTML".
   */
  function runFirstSyncAfterPaint() {
    function tick() {
      void syncCounts();
    }
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          setTimeout(tick, 0);
        });
      });
    } else {
      setTimeout(tick, 0);
    }
  }

  function start() {
    bindEvents();
    runFirstSyncAfterPaint();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
