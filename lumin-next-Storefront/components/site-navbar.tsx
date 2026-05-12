/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export function SiteNavbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Avoid SSR/CSR hydration mismatch by not reading cookies during render.
  // Default to /profile and then adjust after mount.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const profileHref = isLoggedIn === false ? "/login?next=/profile" : "/profile";

  useEffect(() => {
    setIsLoggedIn("authorization" in getAuthHeadersClient());
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const q = searchTerm.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setSearchLoading(false);
      return;
    }

    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
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
        setShowDropdown(true);
      } catch {
        if (mounted) {
          setSuggestions([]);
          setShowDropdown(true);
        }
      } finally {
        if (mounted) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileMenuOpen && !mobileMenuRef.current?.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [mobileMenuOpen]);

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formValue = String(new FormData(e.currentTarget).get("q") || "").trim();
    runSearch(formValue);
  };

  const navigateToSearch = (q: string) => {
    const target = q ? `/products?q=${encodeURIComponent(q)}` : "/products";
    router.push(target);
  };

  const runSearch = (value?: string) => {
    const q = (value ?? searchTerm).trim();
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
                  <Image src="/assets/images/logo.png" alt="Lumin" width={200} height={38} />
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
                      value={searchTerm}
                      onFocus={() => {
                        if (searchTerm.trim().length >= 2) {
                          setShowDropdown(true);
                        }
                      }}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                    />
                    <button type="button" aria-label="Search" onClick={() => runSearch()}>
                      <i className="lastudioicon-zoom-1" />
                    </button>
                  </div>
                </form>
              </div>
              {showDropdown && searchTerm.trim().length >= 2 ? (
                <div
                  className="position-absolute bg-white border rounded shadow-sm p-2"
                  style={{ width: "320px", right: 0, top: "100%", marginTop: "8px", zIndex: 60 }}
                >
                  {searchLoading ? (
                    <p className="px-2 py-2 mb-0 text-secondary">Searching...</p>
                  ) : suggestions.length ? (
                    <>
                      <div className="d-flex flex-column gap-1">
                        {suggestions.map((item) => (
                          <Link
                            key={item.id}
                            href={`/products/${encodeURIComponent(item.slug)}`}
                            onClick={() => {
                              setShowDropdown(false);
                              setSearchTerm(item.name);
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
                          setShowDropdown(false);
                          navigateToSearch(searchTerm.trim());
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
                      <span className="badge"></span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" aria-label="Cart">
                      <i className="lastudioicon-bag-20" />
                      <span className="badge"></span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {mobileMenuOpen ? (
            <div className="lumin-navbar-mobile-panel d-lg-none">
              <form className="lumin-navbar-mobile-search" onSubmit={submitSearch}>
                <div className="meta-search meta-search--dark">
                  <input
                    type="search"
                    name="q"
                    value={searchTerm}
                    onFocus={() => {
                      if (searchTerm.trim().length >= 2) {
                        setShowDropdown(true);
                      }
                    }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                  />
                  <button type="submit" aria-label="Search">
                    <i className="lastudioicon-zoom-1" />
                  </button>
                </div>
                {showDropdown && searchTerm.trim().length >= 2 ? (
                  <div className="lumin-navbar-mobile-suggestions">
                    {searchLoading ? (
                      <p className="px-2 py-2 mb-0 text-secondary">Searching...</p>
                    ) : suggestions.length ? (
                      <>
                        <div className="d-flex flex-column gap-1">
                          {suggestions.map((item) => (
                            <Link
                              key={`mobile-suggestion-${item.id}`}
                              href={`/products/${encodeURIComponent(item.slug)}`}
                              onClick={() => {
                                setShowDropdown(false);
                                setSearchTerm(item.name);
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
                            setShowDropdown(false);
                            runSearch();
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
