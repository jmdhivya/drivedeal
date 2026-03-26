import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { CallIcon, LocationIcon, EmailIcon } from './Icons';
import './Footer.css';

const Footer = () => {
  const { t } = useLanguage();

  const handleSubscribe = (e) => {
    e.preventDefault();
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* Top CTA strip - Find us / Call us / Mail us */}
        <div className="footer-top">
          <div className="footer-top-item">
            <div className="footer-top-icon">
              <LocationIcon className="footer-top-icon-svg" fill="currentColor" />
            </div>
            <div className="footer-top-text">
              <h4>{t('showroomAddress')}</h4>
              <span>Near New Bus Stand, Madathupalayam Road, Perundurai – 638 052</span>
            </div>
          </div>
          <div className="footer-top-item">
            <div className="footer-top-icon">
              <CallIcon className="footer-top-icon-svg" fill="currentColor" />
            </div>
            <div className="footer-top-text">
              <h4>{t('phone')}</h4>
              <span>+91 98429 24259 / 90250 25105</span>
            </div>
          </div>
          <div className="footer-top-item">
            <div className="footer-top-icon">
              <EmailIcon className="footer-top-icon-svg" fill="currentColor" />
            </div>
            <div className="footer-top-text">
              <h4>{t('email')}</h4>
              <span>vr9842924529@gmail.com</span>
            </div>
          </div>
        </div>

        {/* Main footer content */}
        <div className="footer-content">
          {/* Brand / About + Social */}
          <div className="footer-column brand-column">
            <h3 className="footer-title">AP AUTO CARE</h3>
            <p className="footer-text brand-desc">
              Owned by Vignesh T. Your trusted partner for quality second-hand cars with 10+ years of industry experience.
            </p>
            <div className="footer-social">
              <span className="footer-social-label">{t('followUs')}</span>
              <div className="footer-social-links">
                <a href="#" aria-label="Facebook" className="footer-social-circle">
                  FB
                </a>
                <a href="#" aria-label="Twitter" className="footer-social-circle">
                  TW
                </a>
                <a href="#" aria-label="Instagram" className="footer-social-circle">
                  IG
                </a>
              </div>
            </div>
          </div>

          {/* Useful Links */}
          <div className="footer-column footer-links-column">
            <h3 className="footer-title">Useful Links</h3>
            <ul className="footer-links-list">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">{t('about')}</a></li>
              <li><a href="#cars">{t('cars')}</a></li>
              <li><a href="#contact">{t('contact')}</a></li>
              <li><a href="#enquiry">{t('customerEnquiry')}</a></li>
            </ul>
          </div>

          {/* Subscribe */}
          <div className="footer-column footer-subscribe-column">
            <h3 className="footer-title">Subscribe</h3>
            <p className="footer-text footer-subscribe-text">
              Don&apos;t miss updates on new arrivals, offers, and showroom news. Enter your email below.
            </p>
            <form className="footer-subscribe-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="footer-subscribe-input"
                placeholder="Email Address"
                aria-label="Email Address"
              />
              <button type="submit" className="footer-subscribe-button">
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom row */}
        <div className="footer-bottom">
          <p className="footer-bottom-text">
            &copy; {new Date().getFullYear()} AP AUTO CARE. {t('allRightsReserved')}.
          </p>
          <ul className="footer-bottom-menu">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">{t('about')}</a></li>
            <li><a href="#contact">{t('contact')}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

