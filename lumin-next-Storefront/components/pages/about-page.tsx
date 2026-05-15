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
            <h2 className="about-title__title">Handcrafted with care</h2>
            <p>
              We pour small-batch candles with clean ingredients and timeless design—made to warm your
              home and elevate everyday moments.
            </p>
          </div>

          <div className="about-items">
            <div className="about-col">
              <div className="about-item js-scroll ShortFadeInUp scrolled">
                <div className="about-item__top">
                  <div className="about-item__top--image">
                    <img
                      src="/assets/images/about/about-img-1.jpg"
                      alt="Studio"
                      width={391}
                      height={510}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="about-item__top--title">Small batches</h3>
                </div>
                <div className="about-item__bottom">
                  <div className="about-item__bottom--count">01</div>
                  <p className="about-item__bottom--description">
                    Each candle is mixed and poured by hand so fragrance stays true from first light to
                    last.
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
                      alt="Materials"
                      width={391}
                      height={510}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="about-item__top--title">Clean materials</h3>
                </div>
                <div className="about-item__bottom">
                  <div className="about-item__bottom--count">02</div>
                  <p className="about-item__bottom--description">
                    Thoughtfully chosen waxes and wicks for a steadier burn and a softer glow in your
                    space.
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
                      alt="Packaging"
                      width={391}
                      height={510}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="about-item__top--title">Designed for home</h3>
                </div>
                <div className="about-item__bottom">
                  <div className="about-item__bottom--count">03</div>
                  <p className="about-item__bottom--description">
                    Vessels and labels made to sit beautifully on a shelf, side table, or mantle.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="about-video lumin-about-video js-scroll ShortFadeInUp scrolled"
        style={{ backgroundImage: "url(/assets/images/about-bg-1.jpg)" }}
      >
        <div className="container-fluid custom-container">
          <div className="about-video__content js-scroll ShortFadeInUp scrolled">
            <h3 className="about-video__title">Breathing life into ideas</h3>
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
            <h3 className="section-title-3__title">Testimonial</h3>
          </div>

          <div className="testimonial-active testimonial-wrapper js-scroll ShortFadeInUp scrolled">
            <div className="swiper">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <div className="testimonial-item text-center">
                    <div className="testimonial-item__title">Fragrance &amp; burn</div>
                    <p className="testimonial-item__description">
                      “Beautiful scent that fills the room without feeling heavy. The burn is even every
                      time.”
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
                    <div className="testimonial-item__title">Packaging</div>
                    <p className="testimonial-item__description">
                      “Looks gorgeous on my coffee table. Gifting these has become my go-to for
                      housewarmings.”
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
