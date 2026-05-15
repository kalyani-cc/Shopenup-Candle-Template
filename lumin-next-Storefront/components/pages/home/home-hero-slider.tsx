export function HomeHeroSlider() {
  return (
    <div className="slider-section lumin-home-hero slider-active navigation-arrows-style-1">
      <div className="swiper">
        <div className="swiper-wrapper">
          <div
            className="slider-item home-1-slider-style-1 swiper-slide d-md-flex align-items-center home-1-slider-animation"
            style={{ backgroundImage: "url(/assets/images/slider/slider-1.jpg)" }}
          >
            <div className="container-fluid custom-container">
              <div className="home-1-slider-content-style-1 text-center">
                <h3 className="home-1-slider-content-style-1__sub-title">New arrival</h3>
                <h2 className="home-1-slider-content-style-1__title">Bring the light in your life</h2>
                <ul className="home-1-slider-content-style-1__btns justify-content-center">
                  <li className="button-01">
                    <a className="home-1-slider-content-style-1__btn" href="/products">
                      Shop now
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            className="slider-item home-1-slider-style-1 swiper-slide d-md-flex align-items-center home-1-slider-animation"
            style={{ backgroundImage: "url(/assets/images/slider/slider-2.jpg)" }}
          >
            <div className="container-fluid custom-container">
              <div className="home-1-slider-content-style-1 text-center">
                <h3 className="home-1-slider-content-style-1__sub-title">New arrival</h3>
                <h2 className="home-1-slider-content-style-1__title">Light up your moments</h2>
                <ul className="home-1-slider-content-style-1__btns justify-content-center">
                  <li className="button-01">
                    <a className="home-1-slider-content-style-1__btn" href="/products">
                      Shop now
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            className="slider-item home-1-slider-style-1 swiper-slide d-md-flex align-items-center home-1-slider-animation"
            style={{ backgroundImage: "url(/assets/images/slider/slider-3.jpg)" }}
          >
            <div className="container-fluid custom-container">
              <div className="home-1-slider-content-style-1 text-center">
                <h3 className="home-1-slider-content-style-1__sub-title">New arrival</h3>
                <h2 className="home-1-slider-content-style-1__title">We made it with love</h2>
                <ul className="home-1-slider-content-style-1__btns justify-content-center">
                  <li className="button-01">
                    <a className="home-1-slider-content-style-1__btn" href="/products">
                      Shop now
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="swiper-button-prev">
          <i className="lastudioicon-arrow-left" />
        </div>
        <div className="swiper-button-next">
          <i className="lastudioicon-arrow-right" />
        </div>
      </div>
    </div>
  );
}
