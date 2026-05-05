import Link from "next/link";
import { listFooterProductCategories } from "@/lib/shopenup/categories";
import { FooterNewsletterForm } from "@/components/footer-newsletter-form";

export async function SiteFooter() {
  const categories = await listFooterProductCategories(16);

  return (
    <footer className="footer bg-dark text-white mt-5">
      <div className="container-fluid custom-container py-5">
        <div className="row g-4">
          <div className="col-lg-3 col-md-6">
            <h2 className="footer-title">Lumin Store</h2>
            <p>Premium candles and home fragrance products.</p>
          </div>
          <div className="col-lg-3 col-md-6">
            <h2 className="footer-title">Quick Links</h2>
            <ul className="list-unstyled">
              <li>
                <Link href="/products" className="text-white-50 text-decoration-none">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-white-50 text-decoration-none">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-white-50 text-decoration-none">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-white-50 text-decoration-none">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h2 className="footer-title">Categories</h2>
            <ul className="list-unstyled">
              {categories.length ? (
                categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/products?category=${encodeURIComponent(c.handle)}`}
                      className="text-white-50 text-decoration-none"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/products" className="text-white-50 text-decoration-none">
                    All products
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div className="col-lg-3 col-md-6">
            <h2 className="footer-title">Stay with us</h2>
            <p className="text-white-50 mb-3">
              Enter your email below to be the first to know about new collections and product launches.
            </p>
            <FooterNewsletterForm />
          </div>
        </div>
      </div>
    </footer>
  );
}
