import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bannerSlides } from '../api/mockData';
import './Banner.css';

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  return (
    <div className="banner">
      <div
        className="banner-slides"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {bannerSlides.map((slide, index) => (
          <div
            key={slide.id}
            className="banner-slide"
            style={{ background: slide.bgGradient }}
          >
            <div className="slide-content">
              <div className="slide-text">
                <h1>{slide.title}</h1>
                <p>{slide.subtitle}</p>
                <Link to="/robux" className="slide-cta">
                  {slide.cta}
                </Link>
              </div>
              <div className="slide-visual">
                <div className="robux-float">
                  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="56" fill="url(#bannerGradient)" />
                    <path d="M60 30L75 45L60 90L45 45L60 30Z" fill="#fff" opacity="0.9"/>
                    <circle cx="60" cy="52" r="12" fill="#1a1a2e" opacity="0.3"/>
                    <defs>
                      <linearGradient id="bannerGradient" x1="4" y1="4" x2="116" y2="116">
                        <stop stopColor="#00D4AA"/>
                        <stop offset="1" stopColor="#00A3FF"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            <div className="slide-decoration">
              <div className="deco-circle deco-1"></div>
              <div className="deco-circle deco-2"></div>
              <div className="deco-circle deco-3"></div>
            </div>
          </div>
        ))}
      </div>

      <button className="banner-nav prev" onClick={prevSlide}>
        <ChevronLeft size={24} />
      </button>
      <button className="banner-nav next" onClick={nextSlide}>
        <ChevronRight size={24} />
      </button>

      <div className="banner-dots">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
