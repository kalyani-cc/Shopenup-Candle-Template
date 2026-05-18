import Link from "next/link";
import Image from "next/image";
import { listFooterProductCategories } from "@/lib/shopenup/categories";
import { FooterNewsletterForm } from "@/components/footer-newsletter-form";

export async function SiteFooter() {
  const categories = await listFooterProductCategories(16);

  return (
    <footer className="footer-section mt-5">
      <div className="container-fluid custom-container">
        {/* Footer Main Start */}
        <div className="footer-main">
          <div className="footer-col-1 align-self-center">
            {/* Footer About Start */}
            <div className="footer-about text-xxl-start text-center mx-xxl-0 mx-auto">
              <Link className="logo justify-content-xxl-start justify-content-center" href="/">
                <Image src="/assets/images/logo.png" alt="Logo" width={110} height={32} />
              </Link>
              <p>Proin volutpat vitae libero at tincidunt. Maecenas</p>
            </div>
            {/* Footer About End */}
          </div>
          <div className="footer-col-2">
            {/* Footer Link Start */}
            <div className="footer-link">
              <div className="footer-link__wrapper">
                <h2 className="footer-title">Company links</h2>

                <ul className="footer-link__list">
                  <li>
                    <Link href="/about">About us</Link>
                  </li>
                  <li>
                    <Link href="/products">Shop</Link>
                  </li>
                  <li>
                    <Link href="/contact-us">Help Center</Link>
                  </li>
                  <li>
                    <Link href="/contact-us">Policy & Privacy</Link>
                  </li>
                </ul>
              </div>
              <div className="footer-link__wrapper">
                <h2 className="footer-title">Category</h2>

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
                      1214-17, i-Square Corporate Park, Science City Road, Ahmedabad, Gujarat -
                      380063 India
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
            {/* Footer Link End */}
          </div>
          <div className="footer-col-3">
            {/* Footer Newsletter Start */}
            <div className="footer-newsletter">
              <h2 className="footer-title">Stay with us</h2>
              <FooterNewsletterForm />
              <ul className="footer-newsletter__social mt-4">
                <li>
                  <a href="#" aria-label="facebook">
                    <i className="lastudioicon-b-facebook"></i>
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="twitter">
                    <i className="lastudioicon-b-twitter"></i>
                  </a>
                </li>
                <li>
                  <a href="#" aria-label="instagram">
                    <i className="lastudioicon-b-instagram"></i>
                  </a>
                </li>
              </ul>
            </div>
            {/* Footer Newsletter End */}
          </div>
        </div>
        {/* Footer Main End */}

        {/* Footer CopyRight Start */}
        <div className="footer-copyright">
          <div className="row align-items-center">
            <div className="col-12">
              <div className="text-center text-md-start">
                <p>
                  &copy; {new Date().getFullYear()}
                  <span> Lumin </span> Made with <i className="lastudioicon-heart-1"></i> By{" "}
                  <Link href="/">HasThemes</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Footer CopyRight End */}
      </div>
    </footer>
  );
}
