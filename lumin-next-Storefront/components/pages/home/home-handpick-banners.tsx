export function HomeHandpickBanners() {
  return (
    <div className="banner-section section-padding-1">
      <div className="container-fluid custom-container">
        <div className="section-title text-center js-scroll ShortFadeInUp scrolled">
          <h2 className="section-title__title">Handpick today</h2>
          <div className="section-title__shape">
            <img src="/assets/images/section-shape-1.svg" alt="" width={129} height={136} loading="lazy" />
          </div>
        </div>
        <div className="banner-wrapper">
          <div className="row">
            <div className="col-lg-6">
              <div className="banner-item js-scroll ShortFadeInUp scrolled">
                <div className="banner-item__badge trend">
                  <span>trend</span>
                </div>
                <div className="banner-item__image">
                  <img
                    src="/assets/images/banner/banner-1.jpg"
                    alt="Eucalyptus Essential Oil"
                    width={711}
                    height={695}
                    loading="lazy"
                  />
                </div>
                <div className="banner-item__content">
                  <h3 className="banner-item__title">Eucalyptus Essential Oil</h3>
                  <div className="banner-item__divider" />
                  <p className="banner-item__description">Quam pellentesque nec nam aliquam sem et. Enim diam vulpu</p>
                  <a className="banner-item__btn" href="/products">
                    Shop now
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-6 d-flex flex-column gap-3">
              <div className="banner-item js-scroll ShortFadeInUp scrolled">
                <div className="banner-item__badge hot">
                  <span>Hot</span>
                </div>
                <div className="banner-item__image">
                  <img
                    src="/assets/images/banner/banner-2.jpg"
                    alt="Scented Candles"
                    width={711}
                    height={332}
                    loading="lazy"
                  />
                </div>
                <div className="banner-item__content">
                  <h3 className="banner-item__title">Scented Candles</h3>
                  <div className="banner-item__divider" />
                  <p className="banner-item__description">Quam pellentesque nec nam aliquam sem et. Enim diam vulpu</p>
                  <a className="banner-item__btn" href="/products">
                    Shop now
                  </a>
                </div>
              </div>
              <div className="banner-item js-scroll ShortFadeInUp scrolled">
                <div className="banner-item__badge sale">
                  <span>Sale</span>
                </div>
                <div className="banner-item__image">
                  <img
                    src="/assets/images/banner/banner-3.jpg"
                    alt="Vanilla Candles"
                    width={711}
                    height={332}
                    loading="lazy"
                  />
                </div>
                <div className="banner-item__content">
                  <h3 className="banner-item__title">Vanilla Candles</h3>
                  <div className="banner-item__divider" />
                  <p className="banner-item__description">Quam pellentesque nec nam aliquam sem et. Enim diam vulpu</p>
                  <a className="banner-item__btn" href="/products">
                    Shop now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
