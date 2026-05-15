export function HomeSpecialOffer() {
  return (
    <div className="special-offer-section section-padding">
      <div className="container-fluid home-container">
        <div className="section-title text-center js-scroll ShortFadeInUp scrolled">
          <h2 className="section-title__title">Special offer today</h2>
          <div className="section-title__shape">
            <img src="/assets/images/section-shape-1.svg" alt="" width={129} height={136} loading="lazy" />
          </div>
        </div>
        <div className="special-offer-wrapper">
          <div className="row g-0 align-items-center">
            <div className="col-md-6">
              <div className="special-offer-image js-scroll ShortFadeInUp scrolled">
                <img src="/assets/images/special-offer-1.jpg" alt="" width={808} height={773} loading="lazy" />
                <img className="badge" src="/assets/images/special-offer-2.png" alt="" width={205} height={198} loading="lazy" />
              </div>
            </div>
            <div className="col-md-6">
              <div className="special-offer-content js-scroll ShortFadeInUp scrolled">
                <h2 className="special-offer-content__title">
                  <a href="/products">Eucalyptus Essential Oil</a>
                </h2>
                <div className="special-offer-content__price">Only $19.99</div>
                <p className="special-offer-content__description">
                  Quam pellentesque nec nam aliquam sem et. Enim diam vulputate ut pharetra
                </p>
                <div className="special-offer-content__coundown">
                  <div className="countdown-content-two countdown" data-countdown="2023/11/20 23:59:59">
                    <div className="countdown-content-two__timer-item">
                      <div className="countdown-content-two__timer-item--value days">05</div>
                      <div className="countdown-content-two__timer-item--label">days</div>
                    </div>
                    <div className="countdown-content-two__timer-item">
                      <div className="countdown-content-two__timer-item--value hours">06</div>
                      <div className="countdown-content-two__timer-item--label">hours</div>
                    </div>
                    <div className="countdown-content-two__timer-item">
                      <div className="countdown-content-two__timer-item--value minutes">38</div>
                      <div className="countdown-content-two__timer-item--label">minutes</div>
                    </div>
                    <div className="countdown-content-two__timer-item">
                      <div className="countdown-content-two__timer-item--value seconds">48</div>
                      <div className="countdown-content-two__timer-item--label">seconds</div>
                    </div>
                  </div>
                </div>
                <ul className="special-offer-content__btns">
                  <li className="button-01">
                    <a href="/products" className="special-offer-content__btn">
                      Buy now
                    </a>
                  </li>
                  <li className="button-02">
                    <a href="/cart" className="special-offer-content__btn">
                      Add to card
                    </a>
                  </li>
                </ul>
                <div className="special-offer-content__social">
                  <div className="special-offer-content__social-label">Share now on:</div>
                  <ul className="special-offer-content__social-icon">
                    <li>
                      <a href="#" aria-label="facebook">
                        <i className="lastudioicon-b-facebook" />
                      </a>
                    </li>
                    <li>
                      <a href="#" aria-label="twitter">
                        <i className="lastudioicon-b-twitter" />
                      </a>
                    </li>
                    <li>
                      <a href="#" aria-label="pinterest">
                        <i className="lastudioicon-b-pinterest" />
                      </a>
                    </li>
                    <li>
                      <a href="#" aria-label="whatsapp">
                        <i className="lastudioicon-b-whatsapp" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
