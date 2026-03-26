import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import Footer from './Footer';
import FormSubmissionOverlay from './FormSubmissionOverlay';
import { motion } from 'framer-motion';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showConfirmationText, setShowConfirmationText] = useState(false);

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  const [recentlySoldCars, setRecentlySoldCars] = useState([]);
  const [recentlyAddedCars, setRecentlyAddedCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        // Fetch Recently Added (Available cars, sorted by date desc by default)
        const addedResponse = await fetch('http://localhost:5000/api/cars');
        const addedData = await addedResponse.json();
        if (addedData.success) {
          setRecentlyAddedCars(addedData.data.slice(0, 3));
        }

        // Fetch Recently Sold
        const soldResponse = await fetch('http://localhost:5000/api/cars?status=sold');
        const soldData = await soldResponse.json();
        if (soldData.success) {
          setRecentlySoldCars(soldData.data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setShowConfirmationText(false);
    setShowSuccessOverlay(true);

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        setShowSuccessOverlay(false);
        alert(data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setShowSuccessOverlay(false);
      console.error('Error submitting form:', error);
      alert('Failed to submit. Please check if the backend server is running.');
    }
  };

  return (
    <div className="home-page">
      <FormSubmissionOverlay
        isVisible={showSuccessOverlay}
        onAnimationComplete={() => {
          setShowSuccessOverlay(false);
          setShowConfirmationText(true);
        }}
      />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <motion.div 
          className="hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 className="hero-title" variants={fadeInUp}>
            {t('heroTitle')}
          </motion.h1>
          <motion.p className="hero-subtitle" variants={fadeInUp}>
            {t('heroSubtitle')}
          </motion.p>
          <motion.div className="hero-cta" variants={fadeInUp}>
            <button onClick={() => navigate('/cars')} className="btn btn-primary">
              {t('viewCars')}
            </button>
            <a href="#book-visit" className="btn btn-secondary">
              {t('bookVisit')}
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* About / Trust Section */}
      <section className="about-section" id="about">
        <div className="container">
          <motion.div 
            className="about-content-wrapper"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.div className="about-animation" variants={scaleIn}>
              <dotlottie-wc 
                src="https://lottie.host/8b29c8cd-47f3-406f-945c-f063e9c7bd8e/AjvfoYi8UM.lottie"
                style={{ width: '100%', height: '100%', backgroundColor: 'transparent', background: 'transparent' }}
                autoplay 
                loop
                mode="normal"
              ></dotlottie-wc>
            </motion.div>
            <motion.div className="about-text-content" variants={fadeInUp}>
              <h2 className="section-title">About AP Auto Care</h2>
              <p className="section-description">
                Owned by <strong>Vignesh T</strong>, AP Auto Care is a premier second-hand car marketplace with <strong>10+ years of expertise</strong> in providing quality vehicles. 
                Located near the New Bus Stand in Perundurai, we pride ourselves on transparency, trust, and exceptional customer service. 
                Whether you are looking to buy your first car or upgrade to a premium model, our decade of experience ensures you get the best deal and a reliable vehicle.
              </p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="trust-features"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {[
              { title: 'yearsExperience', value: '10+' },
              { title: 'qualityChecked', value: '100%' },
              { title: 'transparentPricing', value: 'No Hidden Costs' },
              { title: 'trustedSellers', value: 'Vignesh T' }
            ].map((feature, index) => (
              <motion.div key={index} className="trust-feature" variants={fadeInUp}>
                <div className="trust-icon">✓</div>
                <h3>{t(feature.title)}</h3>
                <p>{feature.value}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="trust-badges"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="trust-badge">
              <span className="badge-icon">✓</span>
              <span>{t('verifiedCars')}</span>
            </div>
            <div className="trust-badge">
              <span className="badge-icon">✓</span>
              <span>{t('trustedDealers')}</span>
            </div>
            <div className="trust-badge">
              <span className="badge-icon">✓</span>
              <span>{t('customerSatisfaction')}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recently Sold / Recently Added Cars */}
      <section className="cars-preview-section" id="cars">
        <div className="container">
          {/* Recently Sold */}
          {recentlySoldCars.length > 0 && (
            <div className="cars-preview">
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {t('recentlySold')}
              </motion.h2>
              <div className="cars-grid">
                {recentlySoldCars.map((car) => (
                  <motion.div 
                    key={car._id || car.id} 
                    className="car-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -10 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="car-image-wrapper">
                      <img 
                        src={getImageUrl(car.primaryImage)} 
                        alt={`${car.brand} ${car.model}`} 
                        className="car-image" 
                      />
                      <span className="car-status sold">{t('sold')}</span>
                    </div>
                    <div className="car-info">
                      <h3 className="car-model">{car.brand} {car.model}</h3>
                      <p className="car-price">{formatPrice(car.price)}</p>
                      <button 
                        className="btn btn-outline"
                        onClick={() => navigate(`/cars/${car._id || car.id}`)}
                      >
                        {t('viewDetails')}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Added */}
          {recentlyAddedCars.length > 0 && (
            <div className="cars-preview">
              <motion.h2 
                className="section-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                {t('recentlyAdded')}
              </motion.h2>
              <div className="cars-grid">
                {recentlyAddedCars.map((car) => (
                  <motion.div 
                    key={car._id || car.id} 
                    className="car-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -10 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="car-image-wrapper">
                      <img 
                        src={getImageUrl(car.primaryImage)} 
                        alt={`${car.brand} ${car.model}`} 
                        className="car-image" 
                      />
                      <span className="car-status new">{t('new')}</span>
                    </div>
                    <div className="car-info">
                      <h3 className="car-model">{car.brand} {car.model}</h3>
                      <p className="car-price">{formatPrice(car.price)}</p>
                      <button 
                        className="btn btn-outline"
                        onClick={() => navigate(`/cars/${car._id || car.id}`)}
                      >
                        {t('viewDetails')}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Contact / Enquiry Section */}
      <section className="contact-section" id="contact">
        <div className="container">
          <motion.div 
            className="contact-wrapper"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="contact-form-container">
              {showConfirmationText ? (
                <div className="contact-confirmation-message contact-confirmation-only">
                  {t('thanksForSubmission') || 'Thanks for your submission'}
                </div>
              ) : (
              <>
              <motion.div className="contact-info" variants={fadeInUp}>
                <h2 className="section-title contact-title">{t('quickContact')}</h2>
                <p className="section-description contact-subtitle">{t('quickContactSubtitle')}</p>
              </motion.div>
              <motion.form 
                className="contact-form" 
                onSubmit={handleSubmit}
                variants={fadeInUp}
              >
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">{t('name')}</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">{t('phone')}</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">{t('message')}</label>
                    <textarea
                      id="message"
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">
                    {t('submitEnquiry')}
                  </button>
                </motion.form>
              </>
              )}
            </div>

            {/* Lottie Animation on the Right */}
            <div className="contact-animation">
               <dotlottie-wc 
                  src="https://lottie.host/fdfbe615-2e2e-4c2c-a00b-2601f2aad380/dqTPgwzIae.lottie" 
                  className="lottie-anim-contact"
                  autoplay 
                  loop
                ></dotlottie-wc>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Strip / Pre-Footer Action Container */}
      <section className="cta-section" id="book-visit">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="cta-title">{t('ctaTitle')}</h2>
            <p className="cta-subtitle">{t('ctaSubtitle')}</p>
            
            {/* 3 Buttons Side by Side */}
            <div className="cta-buttons">
              <button onClick={() => navigate('/cars')} className="btn btn-primary btn-large">
                {t('exploreCars')} {/* View Cars */}
              </button>
              <a href="#book-visit" className="btn btn-secondary btn-large">
                {t('bookVisit')}
              </a>
              <a href="#contact" className="btn btn-primary btn-large">
                {t('talkToExpert')} {/* Contact Now */}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
