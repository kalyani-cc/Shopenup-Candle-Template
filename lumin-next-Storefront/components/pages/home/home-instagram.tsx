const IG_IMAGES = ["instagram-1", "instagram-2", "instagram-3", "instagram-4", "instagram-5", "instagram-6"];

export function HomeInstagram() {
  return (
    <div className="instagram-section section-padding overflow-hidden">
      <div className="container-fluid home-container">
        <div className="section-title text-center js-scroll ShortFadeInUp scrolled">
          <h2 className="section-title__title">Shop Instagram</h2>
          <div className="section-title__shape">
            <img src="/assets/images/section-shape-1.svg" alt="" width={129} height={136} loading="lazy" />
          </div>
        </div>
        <div className="instagram-wrapper instagram-active js-scroll ShortFadeInUp scrolled">
          <div className="swiper">
            <div className="swiper-wrapper">
              {IG_IMAGES.map((name) => (
                <div key={name} className="swiper-slide">
                  <div className="instagram-item">
                    <a href="/products">
                      <div className="instagram-item__image">
                        <img
                          src={`/assets/images/instagram/${name}.jpg`}
                          alt=""
                          width={360}
                          height={368}
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
        </div>
      </div>
    </div>
  );
}
