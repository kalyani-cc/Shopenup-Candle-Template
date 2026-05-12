"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect } from "react";

export default function AboutPage() {
  useEffect(() => {
    // Re-initialize Masonry and Scroll Animations for Next.js navigation
    const initEffects = () => {
      // Scroll Reveal Logic
      const scrollElements = document.querySelectorAll(".js-scroll");
      const elementInView = (el: Element, dividend = 1) => {
        const elementTop = el.getBoundingClientRect().top;
        return (
          elementTop <=
          (window.innerHeight || document.documentElement.clientHeight) / dividend
        );
      };
      const displayScrollElement = (element: Element) => {
        element.classList.add("scrolled");
      };
      const handleScrollAnimation = () => {
        scrollElements.forEach((el) => {
          if (elementInView(el, 1.25)) {
            displayScrollElement(el);
          }
        });
      };
      window.addEventListener("scroll", handleScrollAnimation);
      handleScrollAnimation(); // Initial check
    };

    const timer = setTimeout(initEffects, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .about-page-wrap {
           padding-top: 40px; /* Reduced from 60px */
        }
        .section-padding-03 {
          padding-top: 70px; /* Reduced from 100px */
          padding-bottom: 70px; /* Reduced from 100px */
        }
        @media (max-width: 991px) {
          .section-padding-03 {
            padding-top: 60px;
            padding-bottom: 60px;
          }
        }
        @media (max-width: 767px) {
          .section-padding-03 {
            padding-top: 50px;
            padding-bottom: 50px;
          }
          .about-page-wrap {
             padding-top: 30px;
          }
        }
        .instagram-grid .masonry-item {
          width: 50% !important;
          float: left;
          padding: 5px;
        }
        @media (min-width: 992px) {
          .instagram-grid .masonry-item {
            width: 25% !important;
          }
        }
        .single-instagram {
          position: relative;
          display: block;
          overflow: hidden;
        }
        .single-instagram img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.5s ease;
        }
        .single-instagram:hover img {
          transform: scale(1.1);
        }
        .instagram-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          color: #fff;
          font-size: 24px;
        }
        .single-instagram:hover .instagram-overlay {
          opacity: 1;
        }
        .mb-50 {
          margin-bottom: 50px;
        }
        .mb-30 {
          margin-bottom: 30px;
        }
      `}} />

      <main className="about-page-wrap">
        {/* About Section Start */}
        <div className="about-section-02 section-padding-03">
          <div className="container-fluid custom-container">
            {/* About Title Start */}
            <div className="about-title text-center js-scroll ShortFadeInUp mb-30">
              <h2 className="about-title__title">Our Passion for Fragrance</h2>
              <p>
                At Lumin, we believe that a candle is more than just a light source; it's an experience.
                Each of our candles is hand-poured with love, using premium soy wax and curated fragrances
                to transform your space into a sanctuary.
              </p>
            </div>
            {/* About Title End */}

            {/* About Items Start */}
            <div className="about-items">
              <div className="about-col">
                <div className="about-item js-scroll ShortFadeInUp">
                  <div className="about-item__top">
                    <div className="about-item__top--image">
                      <Image
                        src="/assets/images/about/about-img-1.jpg"
                        alt="Artisan Crafted"
                        width={391}
                        height={510}
                      />
                    </div>
                    <h3 className="about-item__top--title">Artisan Crafted</h3>
                  </div>
                  <div className="about-item__bottom">
                    <div className="about-item__bottom--count">01</div>
                    <p className="about-item__bottom--description">
                      Every candle is crafted in small batches to ensure the highest
                      quality and attention to detail in every pour.
                    </p>
                  </div>
                </div>
              </div>

              <div className="about-col">
                <div className="about-item js-scroll ShortFadeInUp">
                  <div className="about-item__top">
                    <div className="about-item__top--image">
                      <Image
                        src="/assets/images/about/about-img-2.jpg"
                        alt="Natural Ingredients"
                        width={391}
                        height={510}
                      />
                    </div>
                    <h3 className="about-item__top--title">Natural Ingredients</h3>
                  </div>
                  <div className="about-item__bottom">
                    <div className="about-item__bottom--count">02</div>
                    <p className="about-item__bottom--description">
                      We use 100% natural soy wax and lead-free cotton wicks for a
                      clean, eco-friendly burn that is safe for your home.
                    </p>
                  </div>
                </div>
              </div>

              <div className="about-col">
                <div className="about-item js-scroll ShortFadeInUp">
                  <div className="about-item__top">
                    <div className="about-item__top--image">
                      <Image
                        src="/assets/images/about/about-img-3.jpg"
                        alt="Long Lasting"
                        width={391}
                        height={510}
                      />
                    </div>
                    <h3 className="about-item__top--title">Long Lasting</h3>
                  </div>
                  <div className="about-item__bottom">
                    <div className="about-item__bottom--count">03</div>
                    <p className="about-item__bottom--description">
                      Our candles are designed to provide a slow, even burn, allowing
                      you to enjoy your favorite scents for even longer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* About Items End */}
          </div>
        </div>
        {/* About Section End */}

        {/* Story Section Start */}
        <div className="about-section-03 section-padding-03" style={{ backgroundColor: "#f9f7f5" }}>
          <div className="container-fluid custom-container">
            <div className="row align-items-center">
              <div className="col-lg-6">
                <div className="about-image-3 js-scroll ShortFadeInUp">
                  <Image
                    src="/assets/images/about/about-story.jpg"
                    alt="Our Story"
                    width={700}
                    height={800}
                    className="img-fluid"
                    style={{ borderRadius: "12px" }}
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="about-content-3 js-scroll ShortFadeInUp">
                  <h2 className="about-content-3__title" style={{ fontFamily: "Playfair Display, serif", fontSize: "36px", marginBottom: "20px" }}>The Lumin Journey</h2>
                  <p className="about-content-3__text" style={{ fontSize: "18px", lineHeight: "1.8", color: "#494949", marginBottom: "20px" }}>
                    Founded in 2020, Lumin began with a simple mission: to create
                    candles that are as kind to the planet as they are to your home.
                    What started as a hobby in a small kitchen has grown into a
                    dedicated workshop of artisans passionate about the art of fragrance.
                  </p>
                  <p className="about-content-3__text" style={{ fontSize: "18px", lineHeight: "1.8", color: "#494949", marginBottom: "30px" }}>
                    We source only the finest sustainable materials, from our
                    natural soy wax to our lead-free cotton wicks. Every scent
                    is carefully curated to evoke a memory, a feeling, or a
                    moment of peace in your busy day.
                  </p>
                  <Link href="/products" className="btn btn-dark btn-hover-primary">Discover More</Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Video Start */}
        <div
          className="about-video js-scroll ShortFadeInUp"
          style={{ backgroundImage: "url(/assets/images/about/about-bg-1.jpg)" }}
        >
          <div className="container-fluid custom-container">
            <div className="about-video__content js-scroll ShortFadeInUp">
              <h3 className="about-video__title">Capturing Moments in a Jar</h3>
              <a
                className="about-video__play glightbox"
                href="https://www.youtube.com/watch?v=haoQM8kCM6U"
                aria-label="Video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="512" height="512">
                  <path
                    d="M24.52 38.13C39.66 29.64 58.21 29.99 73.03 39.04L361 215C375.3 223.8 384 239.3 384 256C384 272.7 375.3 288.2 361 296.1L73.03 472.1C58.21 482 39.66 482.4 24.52 473.9C9.377 465.4 0 449.4 0 432V80C0 62.64 9.377 46.63 24.52 38.13V38.13zM56.34 66.35C51.4 63.33 45.22 63.21 40.17 66.04C35.13 68.88 32 74.21 32 80V432C32 437.8 35.13 443.1 40.17 445.1C45.22 448.8 51.41 448.7 56.34 445.7L344.3 269.7C349.1 266.7 352 261.6 352 256C352 250.4 349.1 245.3 344.3 242.3L56.34 66.35z"
                    fill="currentColor"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Testimonial Start */}
        <div className="testimonial-section-02 section-padding-03">
          <div className="container">
            <div className="section-title-03 text-center mb-50">
              <h3 className="title">Testimonials</h3>
            </div>
            <div className="testimonial-active-02 testimonial-wrapper js-scroll ShortFadeInUp">
              <div className="swiper">
                <div className="swiper-wrapper">
                  <div className="swiper-slide">
                    <div className="testimonial-item text-center">
                      <div className="testimonial-item__title">Amazing Scents</div>
                      <p className="testimonial-item__description">
                        “The fragrance is absolutely incredible and fills the whole
                        room without being overwhelming. Best candles I've ever bought!”
                      </p>
                      <div className="testimonial-item__author">
                        <Image
                          className="testimonial-item__image"
                          src="/assets/images/author/m2-testimonial-1.jpg"
                          alt="Testimonial"
                          width={55}
                          height={55}
                        />
                        <p className="testimonial-item__name">Charlotte Carton</p>
                      </div>
                    </div>
                  </div>
                  <div className="swiper-slide">
                    <div className="testimonial-item text-center">
                      <div className="testimonial-item__title">Beautiful Packaging</div>
                      <p className="testimonial-item__description">
                        “Not only do they smell heavenly, but the packaging is so
                        elegant. They make the perfect gift for any occasion.”
                      </p>
                      <div className="testimonial-item__author">
                        <Image
                          className="testimonial-item__image"
                          src="/assets/images/author/m2-testimonial-2.jpg"
                          alt="Testimonial"
                          width={55}
                          height={55}
                        />
                        <p className="testimonial-item__name">Johnny Hart</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-button-next"><i className="lastudioicon-arrow-right"></i></div>
              <div className="swiper-button-prev"><i className="lastudioicon-arrow-left"></i></div>
            </div>
          </div>
        </div>

        {/* Instagram Section Start */}
        <div className="instagram-section section-padding-03">
          <div className="container-fluid p-0">
            <div className="section-title-03 text-center mb-50 js-scroll ShortFadeInUp">
              <h2 className="title">Follow Our Story @Lumin</h2>
            </div>
            <div className="instagram-wrapper instagram-grid">
              <div className="row g-0 masonry-grid">
                {/* Single Instagram Item */}
                <div className="col-6 col-md-3 masonry-item">
                  <div className="single-instagram js-scroll ShortFadeInUp">
                    <a href="#">
                      <Image
                        src="/assets/images/instagram/about-instagram-1.jpg"
                        alt="Instagram"
                        width={480}
                        height={480}
                      />
                      <div className="instagram-overlay">
                        <i className="lastudioicon-b-instagram"></i>
                      </div>
                    </a>
                  </div>
                </div>
                {/* Single Instagram Item */}
                <div className="col-6 col-md-3 masonry-item">
                  <div className="single-instagram js-scroll ShortFadeInUp">
                    <a href="#">
                      <Image
                        src="/assets/images/instagram/about-instagram-2.jpg"
                        alt="Instagram"
                        width={480}
                        height={480}
                      />
                      <div className="instagram-overlay">
                        <i className="lastudioicon-b-instagram"></i>
                      </div>
                    </a>
                  </div>
                </div>
                {/* Single Instagram Item */}
                <div className="col-6 col-md-3 masonry-item">
                  <div className="single-instagram js-scroll ShortFadeInUp">
                    <a href="#">
                      <Image
                        src="/assets/images/instagram/about-instagram-3.jpg"
                        alt="Instagram"
                        width={480}
                        height={480}
                      />
                      <div className="instagram-overlay">
                        <i className="lastudioicon-b-instagram"></i>
                      </div>
                    </a>
                  </div>
                </div>
                {/* Single Instagram Item */}
                <div className="col-6 col-md-3 masonry-item">
                  <div className="single-instagram js-scroll ShortFadeInUp">
                    <a href="#">
                      <Image
                        src="/assets/images/instagram/about-instagram-4.jpg"
                        alt="Instagram"
                        width={480}
                        height={480}
                      />
                      <div className="instagram-overlay">
                        <i className="lastudioicon-b-instagram"></i>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/swiper-bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/masonry.pkgd.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/glightbox.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/nice-select2.js" strategy="afterInteractive" />
      <Script id="lumin-main-loader" strategy="afterInteractive">
        {`
          (function () {
            var started = false;
            var tries = 0;
            var maxTries = 120;
            function ready() {
              return typeof window.Swiper !== "undefined" && typeof window.Masonry !== "undefined";
            }
            function loadMain() {
              if (started) return;
              if (!ready()) return;
              started = true;
              var script = document.createElement("script");
              script.src = "/assets/js/main.js";
              script.async = false;
              document.body.appendChild(script);
            }
            var timer = setInterval(function () {
              tries += 1;
              loadMain();
              if (started || tries >= maxTries) {
                clearInterval(timer);
              }
            }, 100);
            loadMain();
          })();
        `}
      </Script>
    </>
  );
}
