import Image from "next/image";
import Link from "next/link";

/** About page body (navbar + footer come from `app/layout.tsx`). */
export function AboutPageContent() {
  return (
    <>
      <div className="lumin-about-breadcrumb container-fluid custom-container">
        <nav className="lumin-about-breadcrumb__nav" aria-label="Breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link href="/" className="text-decoration-none">
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              About us
            </li>
          </ol>
        </nav>
      </div>

      <div className="about-section-2 section-padding">
        <div className="container-fluid custom-container">
          <div className="about-title text-center js-scroll ShortFadeInUp scrolled">
            <h2 className="about-title__title">Our Passion for Fragrance</h2>
            <p>
              At Lumin, we believe that a candle is more than just a light source; it&apos;s an
              experience. Each of our candles is hand-poured with love, using premium soy wax and
              curated fragrances to transform your space into a sanctuary.
            </p>
          </div>

          <div className="about-items">
            <div className="about-col">
              <div className="about-item js-scroll ShortFadeInUp scrolled">
                <div className="about-item__top">
                  <div className="about-item__top--image">
                    <img
                      src="/assets/images/about/about-img-1.jpg"
                      alt="Artisan crafted"
                      width={391}
                      height={510}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="about-item__top--title">Artisan Crafted</h3>
                </div>
                <div className="about-item__bottom">
                  <div className="about-item__bottom--count">01</div>
                  <p className="about-item__bottom--description">
                    Every candle is crafted in small batches to ensure the highest quality and
                    attention to detail in every pour.
                  </p>
                </div>
              </div>
            </div>

            <div className="about-col">
              <div className="about-item js-scroll ShortFadeInUp scrolled">
                <div className="about-item__top">
                  <div className="about-item__top--image">
                    <img
                      src="/assets/images/about/about-img-2.jpg"
                      alt="Natural ingredients"
                      width={391}
                      height={510}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="about-item__top--title">Natural Ingredients</h3>
                </div>
                <div className="about-item__bottom">
                  <div className="about-item__bottom--count">02</div>
                  <p className="about-item__bottom--description">
                    We use 100% natural soy wax and lead-free cotton wicks for a clean, eco-friendly
                    burn that is safe for your home.
                  </p>
                </div>
              </div>
            </div>

            <div className="about-col">
              <div className="about-item js-scroll ShortFadeInUp scrolled">
                <div className="about-item__top">
                  <div className="about-item__top--image">
                    <img
                      src="/assets/images/about/about-img-3.jpg"
                      alt="Long lasting"
                      width={391}
                      height={510}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="about-item__top--title">Long Lasting</h3>
                </div>
                <div className="about-item__bottom">
                  <div className="about-item__bottom--count">03</div>
                  <p className="about-item__bottom--description">
                    Our candles are designed to provide a slow, even burn, allowing you to enjoy your
                    favorite scents for even longer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lumin-about-story section-padding">
        <div className="container-fluid custom-container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-6">
              <div className="lumin-about-story__image js-scroll ShortFadeInUp scrolled">
                <Image
                  src="/assets/images/about/about-story.jpg"
                  alt="Our story"
                  width={700}
                  height={800}
                  className="img-fluid w-100 h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="lumin-about-story__content js-scroll ShortFadeInUp scrolled">
                <h2 className="lumin-about-story__title">The Lumin Journey</h2>
                <p>
                  Founded in 2020, Lumin began with a simple mission: to create candles that are as
                  kind to the planet as they are to your home. What started as a hobby in a small
                  kitchen has grown into a dedicated workshop of artisans passionate about the art of
                  fragrance.
                </p>
                <p>
                  We source only the finest sustainable materials, from our natural soy wax to our
                  lead-free cotton wicks. Every scent is carefully curated to evoke a memory, a
                  feeling, or a moment of peace in your busy day.
                </p>
                <Link href="/products" className="btn btn-dark btn-hover-primary">
                  Discover More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="about-video lumin-about-video js-scroll ShortFadeInUp scrolled"
        style={{ backgroundImage: "url(/assets/images/about/about-bg-1.jpg)" }}
      >
        <div className="container-fluid custom-container">
          <div className="about-video__content js-scroll ShortFadeInUp scrolled">
            <h3 className="about-video__title">Capturing Moments in a Jar</h3>
            <a
              className="about-video__play glightbox"
              href="https://www.youtube.com/watch?v=haoQM8kCM6U"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Play video"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={28} height={28} aria-hidden="true">
                <path
                  d="M24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13V38.13zM56.34 66.35C51.4 63.33 45.22 63.21 40.17 66.04C35.13 68.88 32 74.21 32 80V432C32 437.8 35.13 443.1 40.17 445.1C45.22 448.8 51.41 448.7 56.34 445.7L344.3 269.7C349.1 266.7 352 261.6 352 256C352 250.4 349.1 245.3 344.3 242.3L56.34 66.35z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="testimonial-section-2 section-padding">
        <div className="container-fluid custom-container">
          <div className="section-title-3 text-center js-scroll ShortFadeInUp scrolled">
            <h3 className="section-title-3__title">Testimonials</h3>
          </div>

          <div className="testimonial-active testimonial-wrapper js-scroll ShortFadeInUp scrolled">
            <div className="swiper">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <div className="testimonial-item text-center">
                    <div className="testimonial-item__title">Amazing Scents</div>
                    <p className="testimonial-item__description">
                      &ldquo;The fragrance is absolutely incredible and fills the whole room without
                      being overwhelming. Best candles I&apos;ve ever bought!&rdquo;
                    </p>
                    <div className="testimonial-item__author">
                      <img
                        className="testimonial-item__image"
                        src="/assets/images/author/m2-testimonial-1.jpg"
                        alt=""
                        width={55}
                        height={55}
                        loading="lazy"
                      />
                      <p className="testimonial-item__name">Charlotte Carton</p>
                    </div>
                  </div>
                </div>
                <div className="swiper-slide">
                  <div className="testimonial-item text-center">
                    <div className="testimonial-item__title">Beautiful Packaging</div>
                    <p className="testimonial-item__description">
                      &ldquo;Not only do they smell heavenly, but the packaging is so elegant. They
                      make the perfect gift for any occasion.&rdquo;
                    </p>
                    <div className="testimonial-item__author">
                      <img
                        className="testimonial-item__image"
                        src="/assets/images/author/m2-testimonial-2.jpg"
                        alt=""
                        width={55}
                        height={55}
                        loading="lazy"
                      />
                      <p className="testimonial-item__name">Johnny Hart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="swiper-button-next">
              <i className="lastudioicon-right-arrow" />
            </div>
            <div className="swiper-button-prev">
              <i className="lastudioicon-left-arrow" />
            </div>
          </div>
        </div>
      </div>

      <div className="instagram-section lumin-about-instagram overflow-hidden">
        <div className="container-fluid custom-container text-center mb-3 mb-md-4">
          <h2 className="lumin-about-instagram__heading js-scroll ShortFadeInUp scrolled">
            Follow Our Story @Lumin
          </h2>
        </div>
        <div className="lumin-about-instagram__row">
          {[
            "about-instagram-1.jpg",
            "about-instagram-2.jpg",
            "about-instagram-4.jpg",
            "about-instagram-3.jpg",
          ].map((file) => (
            <div key={file} className="lumin-about-instagram__cell">
              <div className="instagram-item instagram-item-4 js-scroll ShortFadeInUp scrolled">
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                  <div className="instagram-item__image">
                    <img
                      src={`/assets/images/instagram/${file}`}
                      alt=""
                      width={946}
                      height={525}
                      loading="lazy"
                    />
                  </div>
                  <div className="instagram-item__icon">
                    <i className="lastudioicon-b-instagram" />
                  </div>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="contact-section section-padding">
        <div className="container-fluid custom-container">
          <div className="contact-wrapper js-scroll ShortFadeInUp scrolled">
            <h2 className="contact-wrapper__title">Let&apos;s talk about your project</h2>
            <p className="text-center mb-4 mx-auto" style={{ maxWidth: "36rem" }}>
              Questions about wholesale, custom scents, or an order? We&apos;d love to hear from you.
            </p>
            <div className="text-center">
              <Link href="/contact-us" className="btn btn-dark">
                Contact us
              </Link>
            </div>

            <div className="contact-social mt-5">
              <h2 className="contact-wrapper__title">Connect with us</h2>
              <ul className="contact-social__social">
                <li>
                  <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <i className="lastudioicon-b-facebook" />
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                    <i className="lastudioicon-b-twitter" />
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <i className="lastudioicon-b-instagram" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
