import Link from "next/link";
import Image from "next/image";
import { listFooterProductCategories } from "@/lib/shopenup/categories";
import { FooterNewsletterForm } from "@/components/footer-newsletter-form";

const STORE_NAME = "Arabian Aura";

export async function SiteFooter() {
  const categories = await listFooterProductCategories(16);

  return (
    <footer className="footer-section footer-border lumin-site-footer">
      <div className="container-fluid custom-container">
        <div className="footer-main">
          <div className="footer-col-1 align-self-center">
            <div className="footer-about text-xxl-start text-center mx-xxl-0 mx-auto">
              <Link className="logo justify-content-xxl-start justify-content-center lumin-site-footer__brand" href="/">
                <Image src="/assets/images/logo.png" alt={STORE_NAME} width={110} height={32} />
              </Link>
              <p className="lumin-site-footer__tagline">
                Handcrafted candles and home fragrances inspired by timeless Arabian aromas.
              </p>
            </div>
          </div>

          <div className="footer-col-2">
            <div className="footer-link">
              <div className="footer-link__wrapper">
                <h2 className="footer-title">Company</h2>
                <ul className="footer-link__list">
                  <li>
                    <Link href="/about">About us</Link>
                  </li>
                  <li>
                    <Link href="/products">Shop</Link>
                  </li>
                  <li>
                    <Link href="/contact-us">Contact</Link>
                  </li>
                  <li>
                    <Link href="/blog">Blog</Link>
                  </li>
                </ul>
              </div>
              <div className="footer-link__wrapper">
                <h2 className="footer-title">Categories</h2>
                <ul className="footer-link__list">
                  {categories.length ? (
                    categories.slice(0, 4).map((c) => (
                      <li key={c.id}>
                        <Link href={`/products?category=${encodeURIComponent(c.handle)}`}>{c.label}</Link>
                      </li>
                    ))
                  ) : (
                    <li>
                      <Link href="/products">All products</Link>
                    </li>
                  )}
                </ul>
              </div>
              <div className="footer-link__wrapper">
                <h2 className="footer-title">Contact</h2>
                <ul className="footer-link__list">
                  <li>
                    <span>
                      1214-17, i-Square Corporate Park, Science City Road, Ahmedabad, Gujarat — 380063, India
                    </span>
                  </li>
                  <li>
                    <a href="tel:+917984408712">+91 798-440-8712</a>
                  </li>
                  <li>
                    <a href="mailto:connect@codecolonies.com">connect@codecolonies.com</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-col-3">
            <div className="footer-newsletter">
              <h2 className="footer-title">Stay in touch</h2>
              <FooterNewsletterForm />
              <ul className="footer-newsletter__social lumin-site-footer__social">
                <li>
                  <a href="#" aria-label="Facebook">
                    <i className="lastudioicon-b-facebook" />
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="Twitter">
                    <i className="lastudioicon-b-twitter" />
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="Instagram">
                    <i className="lastudioicon-b-instagram" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          <div className="text-center text-md-start">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
