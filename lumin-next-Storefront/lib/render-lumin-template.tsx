import fs from "node:fs/promises";
import path from "node:path";
import Script from "next/script";
import { notFound } from "next/navigation";
import { listFooterProductCategories, type FooterCategory } from "@/lib/shopenup/categories";

const TEMPLATE_ROOT = path.join(process.cwd(), "templates", "lumin");

function htmlToRoutePath(target: string): string {
  const noExt = target.replace(/\.html$/i, "");

  const routeMap: Record<string, string> = {
    index: "/",
    "contact-us": "/contact-us",
    wishlist: "/wishlist",
    cart: "/cart",
    checkout: "/checkout",
    "my-account": "/profile",
    "order-tracking": "/orders",
    "shop-fullwidth": "/products",
    "product-single": "/products/default-item",
    "thank-you": "/order-confirm",
    about: "/about",
    blog: "/blog",
    "login-register": "/login",
    "forgot-password": "/forgot-password",
    "reset-password": "/reset-password",
    compare: "/products"
  };

  return routeMap[noExt] ?? `/${noExt}`;
}

/** Replace demo mega-menus with storefront nav (Search/Favourites/Cart stay in header only). */
function applyStoreNavigation(markup: string): string {
  const desktopNav = `
                <nav class="header__main--menu position-relative lumin-store-nav-one-row">
                    <ul class="menu-items-list menu-uppercase menu-items-list--dark justify-content-center align-items-center d-flex flex-nowrap gap-2 gap-xl-3 mb-0">
                        <li class="text-nowrap"><a href="/"><span>Home</span></a></li>
                        <li class="text-nowrap"><a href="/products"><span>Products</span></a></li>
                        <li class="text-nowrap"><a href="/about"><span>About us</span></a></li>
                        <li class="text-nowrap"><a href="/contact-us"><span>Contact us</span></a></li>
                        <li class="text-nowrap"><a href="/blog"><span>Blogs</span></a></li>
                    </ul>
                </nav>`;

  const mobileNav = `
            <nav class="navbar-mobile-menu">
                <ul class="mobile-menu-items">
                    <li><a href="/">Home</a></li>
                    <li><a href="/products">Products</a></li>
                    <li><a href="/about">About us</a></li>
                    <li><a href="/contact-us">Contact us</a></li>
                    <li><a href="/blog">Blogs</a></li>
                </ul>
            </nav>`;

  let next = markup
    .replace(/<nav class="header__main--menu[^"]*">[\s\S]*?<\/nav>/i, desktopNav)
    .replace(/<nav class="navbar-mobile-menu">[\s\S]*?<\/nav>/i, mobileNav);

  // Remove the demo template's fixed "Mobile Meta" bottom icon bar (search/wishlist/compare/cart).
  // Storefront navigation already exposes these via header and dedicated pages.
  next = next
    .replace(/<!--\s*Mobile Meta Start\s*-->[\s\S]*?<!--\s*Mobile Meta End\s*-->\s*/i, "")
    .replace(/<div class="mobile-meta\b[^"]*"[\s\S]*?<\/div>\s*/i, "");

  /* Cart icon(s): link to storefront cart; keep original icon markup inside */
  next = next.replace(
    /<button([^>]*data-bs-target="#cartSidebar"[^>]*)>([\s\S]*?)<\/button>/gi,
    `<a href="/cart" aria-label="Cart">$2</a>`
  );

  return next;
}

/** Pull inner HTML of a `<div class="...">` block starting at `start` (index of `<div`). */
function extractFromOpenDiv(html: string, start: number): string {
  const openTagEnd = html.indexOf(">", start);
  if (openTagEnd === -1) return "";
  let i = openTagEnd + 1;
  let depth = 1;
  while (depth > 0 && i < html.length) {
    const divOpen = html.indexOf("<div", i);
    const divClose = html.indexOf("</div>", i);
    if (divClose === -1) {
      return html.slice(openTagEnd + 1).trim();
    }
    if (divOpen !== -1 && divOpen < divClose) {
      depth++;
      i = divOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(openTagEnd + 1, divClose).trim();
      }
      i = divClose + 6;
    }
  }
  return "";
}

/**
 * Merge header middle + header main into one row (search | nav | logo | icons).
 * Only applies to templates that use `header__middle` (e.g. index.html).
 */
function applySingleRowHeader(markup: string): string {
  if (!markup.includes("header__middle")) {
    return markup;
  }

  const navMatch = markup.match(/<nav class="header__main--menu[^"]*"[\s\S]*?<\/nav>/i);
  if (!navMatch) {
    return markup;
  }
  const navHtml = navMatch[0];

  let next = markup.replace(/<!--\s*Header Main Start\s*-->[\s\S]*?<!--\s*Header Main End\s*-->\s*/i, "");

  next = next.replace(
    /(<div class="header__middle[^"]*"[^>]*>\s*<div class="container-fluid custom-container">\s*<div class="row[^"]*"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<!--\s*Header Middle End\s*-->)/i,
    (full, openTag, rowInner, tail) => {
      const iSearch = rowInner.search(/<div class="col-md-4 d-none d-md-block"/);
      const iLogo = rowInner.search(/<div class="col-md-4 col-5"/);
      const iIcons = rowInner.search(/<div class="col-md-4 col-7"/);
      if (iSearch === -1 || iLogo === -1 || iIcons === -1) {
        return full;
      }

      const searchInner = extractFromOpenDiv(rowInner, iSearch);
      const logoInner = extractFromOpenDiv(rowInner, iLogo);
      const iconsInner = extractFromOpenDiv(rowInner, iIcons);

      const mergedRow = `
                    <div class="row align-items-center flex-nowrap g-1 g-lg-2 lumin-header-one-row-main w-100 mx-0">
                        <div class="col-5 col-md-auto flex-shrink-0 text-center text-md-start px-1 lumin-header-logo-col">
                            ${logoInner}
                        </div>
                        <div class="col min-width-0 d-none d-lg-flex justify-content-center align-items-center px-1 lumin-header-nav-col">
                            ${navHtml}
                        </div>
                        <div class="col-auto d-none d-md-block flex-shrink-0 lumin-header-search-col lumin-header-search-after-nav">
                            ${searchInner}
                        </div>
                        <div class="col col-md-auto flex-shrink-0 ms-auto ps-0 lumin-header-icons-col">
                            <div class="d-flex justify-content-end align-items-center flex-nowrap">
                                ${iconsInner}
                            </div>
                        </div>
                    </div>`;

      return openTag + mergedRow + tail;
    }
  );

  return next;
}

/** Tone down wine/demo copy so the site reads as candles-only. */
function applyCandlesOnlyCopy(markup: string): string {
  return markup
    .replace(/Candle\s*&\s*Wine/gi, "Candles")
    .replace(/Wine Website Template/gi, "Candle Store")
    .replace(/\bWines\b/gi, "Candles");
}

function escapeHtmlAttrText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Replace demo footer “Category” column (Man / Woman / …) with storefront category links. */
export function injectFooterCategoryLinks(markup: string, categories: FooterCategory[]): string {
  const pattern =
    /<h2 class="footer-title">Category<\/h2>\s*<ul class="footer-link__list">[\s\S]*?<\/ul>/gi;
  const items =
    categories.length > 0
      ? categories
          .map(
            (c) =>
              `<li><a href="/products?category=${encodeURIComponent(c.handle)}">${escapeHtmlAttrText(
                c.label
              )}</a></li>`
          )
          .join("")
      : `<li><a href="/products">All products</a></li>`;
  const replacement = `<h2 class="footer-title">Category</h2>\n                            <ul class="footer-link__list">\n                                ${items}\n                            </ul>`;
  return markup.replace(pattern, replacement);
}

/** Fetch categories and swap template footer category lists (runs server-side). */
export async function finalizeLuminTemplateMarkup(markup: string): Promise<string> {
  const categories = await listFooterProductCategories(16);
  return injectFooterCategoryLinks(markup, categories);
}

export function transformLuminTemplateMarkup(markup: string): string {
  const bodyMatch = markup.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : markup;

  return applyCandlesOnlyCopy(
    applySingleRowHeader(
      applyStoreNavigation(
        bodyContent
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/(src|href)=["']assets\//gi, '$1="/assets/')
          .replace(/href=["']([^"'#?:]+\.html)["']/gi, (_m, fileName: string) => {
            return `href="${htmlToRoutePath(fileName)}"`;
          })
          /* Use Next footer component globally; remove template footer from mirrored HTML. */
          .replace(/<!--\s*Footer Start\s*-->[\s\S]*?<!--\s*Footer End\s*-->/i, "")
          .replace(/<footer class="footer-section[\s\S]*?<\/footer>/i, "")
      )
    )
  ).replace(/<!--\s*Header Start\s*-->[\s\S]*?<!--\s*Header End\s*-->/i, "");
}

export async function loadLuminTemplate(templateFile: string): Promise<string> {
  const templatePath = path.join(TEMPLATE_ROOT, templateFile);

  try {
    return await fs.readFile(templatePath, "utf8");
  } catch {
    notFound();
  }
}

export function renderTransformedLuminMarkup(pageMarkup: string, opts?: { disableTemplateMainJs?: boolean }) {
  const disableTemplateMainJs = Boolean(opts?.disableTemplateMainJs);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: pageMarkup }} />
      <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/swiper-bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/masonry.pkgd.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/glightbox.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/nice-select2.js" strategy="afterInteractive" />
      {!disableTemplateMainJs ? (
        <Script id="lumin-main-loader" strategy="afterInteractive">
          {`
            (function () {
              if (window.__luminMainLoaded) return;
              var started = false;
              var tries = 0;
              var maxTries = 120; // ~12s at 100ms
              function ready() {
                return typeof window.Swiper !== "undefined";
              }
              function loadMain() {
                if (window.__luminMainLoaded || started) return;
                if (!ready()) return;
                started = true;
                var script = document.createElement("script");
                script.src = "/assets/js/main.js";
                script.async = false;
                script.onload = function () {
                  window.__luminMainLoaded = true;
                };
                script.onerror = function () {
                  started = false;
                };
                document.body.appendChild(script);
              }
              var timer = setInterval(function () {
                tries += 1;
                loadMain();
                if (window.__luminMainLoaded || tries >= maxTries) {
                  clearInterval(timer);
                }
              }, 100);
              loadMain();
            })();
          `}
        </Script>
      ) : null}
    </>
  );
}

export async function renderLuminTemplate(templateFile: string) {
  const html = await loadLuminTemplate(templateFile);
  let pageMarkup = transformLuminTemplateMarkup(html);
  pageMarkup = await finalizeLuminTemplateMarkup(pageMarkup);
  return renderTransformedLuminMarkup(pageMarkup);
}
