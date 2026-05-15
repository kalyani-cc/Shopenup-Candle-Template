/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { sdk } from "@/lib/config";
import { getAuthHeadersClient } from "@/lib/shopenup/client-cookies";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact-us" },
  { label: "Blogs", href: "/blog" }
];

type SearchSuggestion = {
  id: string;
  name: string;
  slug: string;
  image?: string;
};

type ProductSearchResponse = {
  products?: Array<{
    id: string;
    handle?: string;
    title?: string;
    thumbnail?: string;
  }>;
};

function useProductSuggestions(searchTerm: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchTerm.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const data = await sdk.client.fetch<ProductSearchResponse>("/store/products", {
          method: "GET",
          query: {
            q,
            limit: 6,
            fields: "id,title,handle,thumbnail"
          },
          cache: "no-store"
        });

        if (!mounted) return;

        const nextSuggestions = (data.products || [])
          .filter((product) => product.id && (product.handle || product.id))
          .map((product) => ({
            id: product.id,
            name: product.title || "Untitled Product",
            slug: product.handle || product.id,
            image: product.thumbnail
          }));

        setSuggestions(nextSuggestions);
      } catch {
        if (mounted) {
          setSuggestions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  return { suggestions, loading };
}

export function SiteNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchWrapRef = useRef<HTMLFormElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const qFromUrl = searchParams.get("q") || "";
  /** Desktop bar follows the URL `q` (e.g. on /products?q=…). Mobile keeps its own draft — not synced from URL. */
  const [desktopSearchTerm, setDesktopSearchTerm] = useState(qFromUrl);
  const [mobileSearchTerm, setMobileSearchTerm] = useState("");
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { suggestions: desktopSuggestions, loading: desktopSearchLoading } =
    useProductSuggestions(desktopSearchTerm);
  const { suggestions: mobileSuggestions, loading: mobileSearchLoading } =
    useProductSuggestions(mobileSearchTerm);

  // Avoid SSR/CSR hydration mismatch by not reading cookies during render.
  // Default to /profile and then adjust after mount.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const profileHref = isLoggedIn === false ? "/login?next=/profile" : "/profile";

  useEffect(() => {
    setIsLoggedIn("authorization" in getAuthHeadersClient());
  }, []);

  useEffect(() => {
    const next = searchParams.get("q") || "";
    setDesktopSearchTerm(next);
  }, [searchParams]);

  useEffect(() => {
    if (desktopSearchTerm.trim().length >= 2) {
      setShowDesktopDropdown(true);
    } else {
      setShowDesktopDropdown(false);
    }
  }, [desktopSearchTerm]);

  useEffect(() => {
    if (mobileSearchTerm.trim().length >= 2) {
      setShowMobileDropdown(true);
    } else {
      setShowMobileDropdown(false);
    }
  }, [mobileSearchTerm]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const t = event.target as Node;
      if (!searchWrapRef.current?.contains(t)) {
        setShowDesktopDropdown(false);
      }
      if (!mobileSearchWrapRef.current?.contains(t)) {
        setShowMobileDropdown(false);
      }
      if (mobileMenuOpen && !mobileMenuRef.current?.contains(t)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setShowMobileDropdown(false);
    }
  }, [mobileMenuOpen]);

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formValue = String(new FormData(e.currentTarget).get("q") || "").trim();
    navigateToSearch(formValue);
  };

  const navigateToSearch = (q: string) => {
    const trimmed = q.trim();
    if (pathname === "/products") {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      const s = params.toString();
      router.push(s ? `/products?${s}` : "/products");
      return;
    }
    const target = trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products";
    router.push(target);
  };

  const runDesktopSearch = (value?: string) => {
    const q = (value ?? desktopSearchTerm).trim();
    navigateToSearch(q);
  };

  const runMobileSearch = (value?: string) => {
    const q = (value ?? mobileSearchTerm).trim();
    navigateToSearch(q);
  };

  return (
    <header className="header bg-white lumin-site-navbar-single-row">
      

      {/* Single row: search | logo | nav | icons (desktop); horizontal scroll if narrow */}
      <div className="header__middle d-flex align-items-center py-2 py-md-3" ref={mobileMenuRef}>
        <div className="container-fluid custom-container">
          <div className="d-flex align-items-center flex-nowrap gap-2 gap-md-3 w-100 lumin-navbar-main-row">
            <button
              type="button"
              className="lumin-navbar-mobile-toggle d-lg-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              <i className="lastudioicon-menu-8-1" />
            </button>
          

            <div className="flex-shrink-0 lumin-navbar-logo-col">
              <div className="header-mid-logo text-md-center mb-0">
                <Link href="/">
                  {/* <Image src="/assets/images/logo.png" alt="Lumin" width={200} height={38} /> */}
                  <h3>Arabian Aura</h3>
                </Link>
              </div>
            </div>

            <nav className="header__main--menu position-relative lumin-store-nav-one-row flex-grow-1 min-width-0 mx-1 mx-lg-2">
              <ul className="menu-items-list menu-uppercase menu-items-list--dark justify-content-center align-items-center d-flex flex-nowrap gap-1 gap-lg-2 gap-xl-3 mb-0 lumin-navbar-nav-scroll">
                {navItems.map((item) => (
                  <li key={item.href} className="text-nowrap flex-shrink-0">
                    <Link href={item.href}>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div ref={searchWrapRef} className="flex-shrink-0 d-none d-md-block lumin-navbar-search-col position-relative">
              <div className="header-mid-search mb-0">
                <form onSubmit={submitSearch}>
                  <div className="meta-search meta-search--dark">
                    <input
                      type="search"
                      name="q"
                      value={desktopSearchTerm}
                      onFocus={() => {
                        if (desktopSearchTerm.trim().length >= 2) {
                          setShowDesktopDropdown(true);
                        }
                      }}
                      onChange={(e) => setDesktopSearchTerm(e.target.value)}
                      placeholder="Search products..."
                    />
                    <button type="button" aria-label="Search" onClick={() => runDesktopSearch()}>
                      <i className="lastudioicon-zoom-1" />
                    </button>
                  </div>
                </form>
              </div>
              {showDesktopDropdown && desktopSearchTerm.trim().length >= 2 ? (
                <div
                  className="position-absolute bg-white border rounded shadow-sm p-2"
                  style={{ width: "320px", right: 0, top: "100%", marginTop: "8px", zIndex: 60 }}
                >
                  {desktopSearchLoading ? (
                    <p className="px-2 py-2 mb-0 text-secondary">Searching...</p>
                  ) : desktopSuggestions.length ? (
                    <>
                      <div className="d-flex flex-column gap-1">
                        {desktopSuggestions.map((item) => (
                          <Link
                            key={item.id}
                            href={`/products/${encodeURIComponent(item.slug)}`}
                            onClick={() => {
                              setShowDesktopDropdown(false);
                              setDesktopSearchTerm(item.name);
                            }}
                            className="d-flex align-items-center gap-2 text-dark text-decoration-none p-2 rounded"
                          >
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={36}
                                height={36}
                                className="rounded border"
                              />
                            ) : (
                              <div
                                className="rounded border bg-light"
                                style={{ width: "36px", height: "36px", minWidth: "36px" }}
                              />
                            )}
                            <span className="text-truncate">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDesktopDropdown(false);
                          navigateToSearch(desktopSearchTerm.trim());
                        }}
                        className="btn btn-link text-decoration-none p-2 w-100 text-start"
                      >
                        View all results
                      </button>
                    </>
                  ) : (
                    <p className="px-2 py-2 mb-0 text-secondary">No products found.</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex-shrink-0 ms-auto">
              <div className="header-mid-meta">
                <ul className="header-mid-meta__item justify-content-end mb-0">
                  <li>
                    <Link href={profileHref} aria-label="Profile">
                      <i className="lastudioicon-single-01-2" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" aria-label="Wishlist">
                      <i className="lastudioicon-heart-2" />
                      <span className="badge" style={{ display: "none" }} suppressHydrationWarning />
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" aria-label="Cart">
                      <i className="lastudioicon-bag-20" />
                      <span className="badge" style={{ display: "none" }} suppressHydrationWarning />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="lumin-navbar-mobile-panel d-lg-none">
              <form
                ref={mobileSearchWrapRef}
                className="lumin-navbar-mobile-search"
                onSubmit={submitSearch}
              >
                <div className="meta-search meta-search--dark">
                  <input
                    type="search"
                    name="q"
                    value={mobileSearchTerm}
                    onFocus={() => {
                      if (mobileSearchTerm.trim().length >= 2) {
                        setShowMobileDropdown(true);
                      }
                    }}
                    onChange={(e) => setMobileSearchTerm(e.target.value)}
                    placeholder="Search products..."
                  />
                  <button type="submit" aria-label="Search">
                    <i className="lastudioicon-zoom-1" />
                  </button>
                </div>
                {showMobileDropdown && mobileSearchTerm.trim().length >= 2 ? (
                  <div className="lumin-navbar-mobile-suggestions">
                    {mobileSearchLoading ? (
                      <p className="px-2 py-2 mb-0 text-secondary">Searching...</p>
                    ) : mobileSuggestions.length ? (
                      <>
                        <div className="d-flex flex-column gap-1">
                          {mobileSuggestions.map((item) => (
                            <Link
                              key={`mobile-suggestion-${item.id}`}
                              href={`/products/${encodeURIComponent(item.slug)}`}
                              onClick={() => {
                                setShowMobileDropdown(false);
                                setMobileSearchTerm(item.name);
                                setMobileMenuOpen(false);
                              }}
                              className="d-flex align-items-center gap-2 text-dark text-decoration-none p-2 rounded"
                            >
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={36}
                                  height={36}
                                  className="rounded border"
                                />
                              ) : (
                                <div
                                  className="rounded border bg-light"
                                  style={{ width: "36px", height: "36px", minWidth: "36px" }}
                                />
                              )}
                              <span className="text-truncate">{item.name}</span>
                            </Link>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMobileDropdown(false);
                            runMobileSearch();
                          }}
                          className="btn btn-link text-decoration-none p-2 w-100 text-start"
                        >
                          View all results
                        </button>
                      </>
                    ) : (
                      <p className="px-2 py-2 mb-0 text-secondary">No products found.</p>
                    )}
                  </div>
                ) : null}
              </form>
              <ul className="lumin-navbar-mobile-links">
                {navItems.map((item) => (
                  <li key={`mobile-${item.href}`}>
                    <Link href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
