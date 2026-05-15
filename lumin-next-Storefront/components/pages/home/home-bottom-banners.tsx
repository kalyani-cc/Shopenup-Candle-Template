export function HomeBottomBanners() {
  return (
    <div className="banner-section">
      <div className="row g-0">
        <div className="col-lg-6">
          <div className="banner-item-2 banner-bg-01 js-scroll ShortFadeInUp scrolled">
            <div className="banner-item-2__inner d-flex flex-row-reverse align-items-center flex-wrap text-center">
              <div className="banner-item-2__image">
                <img src="/assets/images/banner/banner-5.jpg" alt="" width={200} height={200} loading="lazy" />
              </div>
              <div className="banner-item-2__content">
                <h3 className="banner-item-2__sub-title">Eucalyptus Essential Oil</h3>
                <div className="banner-item-2__discount">
                  <div className="discount-sale">Sale off</div>
                  <div className="discount-count">40%</div>
                </div>
                <a className="banner-item-2__btn" href="/products">
                  Shop now
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div
            className="banner-item-2 banner-bg-02 js-scroll ShortFadeInUp scrolled"
            style={{ backgroundImage: "url(/assets/images/banner/banner-6.jpg)" }}
          >
            <div className="banner-item-2__content text-center ms-auto">
              <h3 className="banner-item-2__sub-title">Terracotta Tealight Holder</h3>
              <h2 className="banner-item-2__title">New trend</h2>
              <a className="banner-item-2__btn" href="/products">
                Shop now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
