import Script from "next/script";

export type LuminTemplateScriptsProps = {
  /** Skip loading `main.js` when the page has no Swiper / Lumin init hooks. */
  disableTemplateMainJs?: boolean;
};

/**
 * Vendor + theme scripts used by Lumin HTML templates (Swiper, GLightbox, etc.).
 * Use on TSX pages that render Lumin body markup via `renderTransformedLuminMarkup` (see `lib/lumin-page-markup.ts`).
 */
export function LuminTemplateScripts({ disableTemplateMainJs }: LuminTemplateScriptsProps) {
  return (
    <>
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
              var maxTries = 120;
              function ready() {
                return typeof window.Swiper !== "undefined";
              }
              function loadMain() {
                if (window.__luminMainLoaded || started) return;
                if (!ready()) return;
                started = true;
                var script = document.createElement("script");
                script.src = "/assets/js/main.js?v=lumin2026b";
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
