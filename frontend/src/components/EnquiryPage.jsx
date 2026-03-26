import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import FormSubmissionOverlay from './FormSubmissionOverlay';
import './EnquiryPage.css';

const EnquiryPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredBrand: searchParams.get('brand') || '',
    preferredModel: searchParams.get('model') || '',
    budgetRange: '',
    city: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [showConfirmationText, setShowConfirmationText] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name should contain only letters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^\d+$/.test(formData.phone.trim())) {
      newErrors.phone = 'Mobile number should contain only digits';
    } else if (formData.phone.trim().length < 10 || formData.phone.trim().length > 15) {
      newErrors.phone = 'Enter a valid mobile number';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Enquiry message cannot be empty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    setErrors(prev => ({ ...prev, form: '' }));
    setShowConfirmationText(false);
    setShowSuccessOverlay(true);

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          preferredBrand: formData.preferredBrand.trim(),
          preferredModel: formData.preferredModel.trim(),
          budgetRange: formData.budgetRange.trim(),
          city: formData.city.trim(),
          message: formData.message.trim(),
          type: 'page_enquiry'
        })
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: '',
          email: '',
          phone: '',
          preferredBrand: '',
          preferredModel: '',
          budgetRange: '',
          city: '',
          message: ''
        });
      } else {
        setShowSuccessOverlay(false);
        setErrors(prev => ({ ...prev, form: data.message || 'Failed to submit enquiry. Please try again.' }));
      }
    } catch (error) {
      setShowSuccessOverlay(false);
      setErrors(prev => ({ ...prev, form: 'Failed to submit enquiry. Please try again later.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="enquiry-page-container">
      <FormSubmissionOverlay
        isVisible={showSuccessOverlay}
        onAnimationComplete={() => {
          setShowSuccessOverlay(false);
          setShowConfirmationText(true);
        }}
      />

      <div className="container enquiry-container-width">
        <div className="enquiry-card">
          
          {/* Lottie Animation on the Left */}
          <div className="enquiry-animation">
             <dotlottie-wc 
                src="https://lottie.host/d4ef2112-c92b-4844-b1ba-881aac51bc7a/cbFmHJEVzw.lottie" 
                className="lottie-anim"
                autoplay 
                loop
              ></dotlottie-wc>
          </div>

          <div className="enquiry-form-wrapper">
            <div className="enquiry-form-container">
              {showConfirmationText ? (
                <div className="enquiry-confirmation-message enquiry-confirmation-only">
                  {t('thanksForSubmission') || 'Thanks for your submission'}
                </div>
              ) : (
              <>
              <h1 className="enquiry-title">
                {t('customerEnquiry') || 'Customer Enquiry'}
              </h1>
              <p className="enquiry-subtitle">
                {t('quickContactSubtitle') || 'Share your requirements and we will contact you with the best matching used cars.'}
              </p>
                  <div className="enquiry-message-area">
                    {errors.form && (
                      <div className="error-message-box">
                        {errors.form}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="enquiry-form">
                  <div className="form-row grid-2">
                    <div className="form-group">
                      <label>{t('fullName') || 'Full Name'}</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {errors.name && <div className="error-text">{errors.name}</div>}
                    </div>
                    <div className="form-group">
                      <label>{t('email') || 'Email Address'}</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      {errors.email && <div className="error-text">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="form-row grid-2">
                    <div className="form-group">
                      <label>{t('phone') || 'Mobile Number'}</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                      {errors.phone && <div className="error-text">{errors.phone}</div>}
                    </div>
                    <div className="form-group">
                      <label>Budget Range</label>
                      <input
                        type="text"
                        name="budgetRange"
                        value={formData.budgetRange}
                        onChange={handleChange}
                        placeholder="e.g. ₹5L - ₹8L"
                      />
                    </div>
                  </div>

                  <div className="form-row grid-2">
                    <div className="form-group">
                      <label>Preferred Car Brand</label>
                      <input
                        type="text"
                        name="preferredBrand"
                        value={formData.preferredBrand}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Preferred Car Model</label>
                      <input
                        type="text"
                        name="preferredModel"
                        value={formData.preferredModel}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>City / Location</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('message') || 'Enquiry Message'}</label>
                    <textarea
                      name="message"
                      rows="4"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                    {errors.message && <div className="error-text">{errors.message}</div>}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (t('submitting') || 'Submitting...') : (t('submitEnquiry') || 'Submit Enquiry')}
                  </button>
                </form>
              </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryPage;
