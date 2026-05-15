export function HomeBrands() {
  return (
    <div className="brand-section section-padding">
      <div className="container-fluid home-container">
        <div className="section-title text-center js-scroll ShortFadeInUp scrolled">
          <h2 className="section-title__title">Popular brands</h2>
          <div className="section-title__shape">
            <img src="/assets/images/section-shape-1.svg" alt="" width={129} height={136} loading="lazy" />
          </div>
        </div>
        <div className="brand-active js-scroll ShortFadeInUp">
          <div className="swiper">
            <div className="swiper-wrapper">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="brand-item swiper-slide">
                  <img
                    src={`/assets/images/brand/brand-${n}.svg`}
                    alt=""
                    width={250}
                    height={160}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
