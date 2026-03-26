import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { WishlistIcon, WishlistFillIcon, ShareIcon } from './Icons';
import './CarDetails.css';
import './Cars.css'; // Reuse card styles for related cars

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth(); // Assuming auth context provides user info
  
  const [car, setCar] = useState(null);
  const [relatedCars, setRelatedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [soldInfo, setSoldInfo] = useState(null);
  const [isBookingConfirmed, setIsBookingConfirmed] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    state: '',
    country: '',
    visitDate: '',
    visitTime: '',
    paymentPreference: 'No Payment (Visit Only)',
    initialAmount: '',
    pincode: ''
  });

  useEffect(() => {
    fetchCarDetails();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (user && car) {
        checkWishlistStatus();
    }
    if (car?.status === 'sold') {
        fetchSoldInfo();
    }
    if (car?._id) {
        checkBookingConfirmation();
    }
  }, [user, car]);

  const checkBookingConfirmation = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/bookings?carId=${car._id}`);
        const data = await response.json();
        if (data.success) {
            const hasConfirmed = data.data.some(b => b.status === 'Accepted');
            setIsBookingConfirmed(hasConfirmed);
        }
    } catch (err) {
        console.error('Error checking booking confirmation:', err);
    }
  };

  const fetchSoldInfo = async () => {
    try {
        const response = await fetch(`http://localhost:5000/api/sold-cars/car/${car._id}`);
        const data = await response.json();
        if (data.success) {
            setSoldInfo(data.data);
        }
    } catch (err) {
        console.error('Error fetching sold info:', err);
    }
  };

  const checkWishlistStatus = async () => {
    if (!user?._id) return;
    try {
        const response = await fetch(`http://localhost:5000/api/wishlist/${user._id}`);
        const data = await response.json();
        if (data.success) {
            const exists = data.data.some(item => (item.carId?._id || item.carId) === car._id);
            setIsWishlisted(exists);
        }
    } catch (err) {
        console.error('Error checking wishlist status:', err);
    }
  };

  useEffect(() => {
    if (user) {
        setBookingData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.location || ''
        }));
    }
  }, [user]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  const fetchCarDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/cars/${id}`);
      const data = await response.json();
      if (data.success) {
        setCar(data.data);
        setRelatedCars(data.related || []);
        setBookingCount(data.bookingCount || 0);
        if (data.data.images && data.data.images.length > 0) {
            setActiveImage(data.data.images[0]);
        } else if (data.data.primaryImage) {
            setActiveImage(data.data.primaryImage);
        }
      }
    } catch (error) {
      console.error('Error fetching car details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            carId: car._id,
            userId: user ? user._id : null,
            customerName: bookingData.name,
            customerEmail: bookingData.email,
            customerPhone: bookingData.phone,
            customerAddress: bookingData.address,
            customerDistrict: bookingData.district,
            customerState: bookingData.state,
            customerCountry: bookingData.country,
            customerPincode: bookingData.pincode,
            visitDate: bookingData.visitDate,
            visitTime: bookingData.visitTime,
            paymentPreference: bookingData.paymentPreference,
            initialAmount: bookingData.paymentPreference === 'Initial Amount' ? Number(bookingData.initialAmount) : undefined
        };

        const response = await fetch('http://localhost:5000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.success) {
            alert(t('bookingSuccess') || 'Booking request sent successfully!');
            setShowBookingModal(false);
            setBookingCount(prev => prev + 1);
            // Optionally clear the form
            setBookingData({
                name: user?.name || '',
                email: user?.email || '',
                phone: user?.phone || '',
                address: user?.location || '',
                district: '',
                state: '',
                country: '',
                pincode: '',
                visitDate: '',
                visitTime: '',
                paymentPreference: 'No Payment (Visit Only)',
                initialAmount: ''
            });
        } else {
            alert(data.message || (t('bookingError') || 'Failed to book. Please try again.'));
        }
    } catch (error) {
        console.error('Error booking car:', error);
        alert('Network error while booking. Please try again.');
    }
  };

  const handleInputChange = (e) => {
      setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const addToWishlist = async () => {
      if (!user) {
          alert(t('loginRequired') || 'Please login to manage your wishlist');
          return;
      }
      
      try {
          if (isWishlisted) {
              // Remove from wishlist
              const res = await fetch(`http://localhost:5000/api/wishlist/${user._id}/${car._id}`, {
                  method: 'DELETE'
              });
              const data = await res.json();
              if (data.success) {
                  setIsWishlisted(false);
              } else {
                  console.error('Failed to remove from wishlist:', data.message);
              }
          } else {
              // Add to wishlist
              const res = await fetch('http://localhost:5000/api/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user._id, carId: car._id })
              });
              const data = await res.json();
              if (data.success) {
                  setIsWishlisted(true);
              } else {
                  console.error('Failed to add to wishlist:', data.message);
              }
          }
      } catch (err) {
          console.error(err);
      }
  };

  if (loading) {
      return (
          <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading details...</p>
          </div>
      );
  }

  if (!car) {
      return <div className="error-container">Car not found</div>;
  }

  return (
    <div className="car-details-container">
      <div className="details-wrapper">
        {/* Breadcrumb */}
        <div className="breadcrumb">
            <span onClick={() => navigate('/')}>Home</span> &gt; 
            <span onClick={() => navigate('/cars')}>Cars</span> &gt; 
            <span className="current">{car.brand} {car.model}</span>
        </div>

        <div className="details-main-content">
            {/* Section 1: Car Image Gallery (45%) */}
            <div className="gallery-section">
                <div className="main-image-container">
                    <img src={getImageUrl(activeImage) || 'https://via.placeholder.com/600x400?text=No+Image'} alt={car.model} className="main-image" />
                    <div className={`status-badge-large ${car.status}`}>{car.status}</div>
                </div>
                {car.images && car.images.length > 0 && (
                    <div className="thumbnail-list">
                        {car.images.map((img, index) => (
                            <img 
                                key={index} 
                                src={getImageUrl(img)} 
                                alt={`View ${index + 1}`} 
                                className={`thumbnail ${activeImage === img ? 'active' : ''}`}
                                onClick={() => setActiveImage(img)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Section 2: Car Information (55%) */}
            <div className="info-sidebar">
                <div className="info-card">
                    <div className="info-header">
                        <div className="title-group">
                            <h1 className="details-title">{car.brand} {car.model}</h1>
                            <div className="details-subtitle">{car.year} • {car.fuelType} • {car.transmissionType || 'Manual'}</div>
                        </div>
                        <div className="price-tag">
                            {formatPrice(car.price)}
                        </div>
                    </div>

                    {isBookingConfirmed && car.status !== 'sold' ? (
                        <div className="booking-confirmed-badge animate-fade-in">
                            <span className="counter-icon">✅</span>
                            <span className="counter-text">Booking Confirmed</span>
                        </div>
                    ) : (car.status === 'available' && bookingCount > 0) && (
                        <div className="booking-counter-badge animate-fade-in">
                            <span className="counter-icon">🔥</span>
                            <span className="counter-text">{bookingCount} {bookingCount === 1 ? 'user has' : 'users have'} already booked this car</span>
                        </div>
                    )}

                    {/* Sold Info Section */}
                    {car.status === 'sold' && (
                        <div className="sold-status-container animate-fade-in">
                            <div className="sold-badge-detail">Status: SOLD</div>
                            <p className="sold-message">This vehicle has been sold to another customer.</p>
                            
                            {soldInfo && (
                                <div className="buyer-info-section">
                                    <h3>Buyer Information</h3>
                                    <div className="buyer-info-grid">
                                        <div className="buyer-field">
                                            <span className="label">Name:</span>
                                            <span className="value">{soldInfo.buyerName}</span>
                                        </div>
                                        <div className="buyer-field">
                                            <span className="label">Purchase Date:</span>
                                            <span className="value">{new Date(soldInfo.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="buyer-field">
                                            <span className="label">Purchase Price:</span>
                                            <span className="value">{formatPrice(soldInfo.salePrice)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Basic Details Grid */}
                    <div className="detail-group">
                        <h3>Basic Car Details</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Brand</span>
                                <span className="info-value">{car.brand}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Model</span>
                                <span className="info-value">{car.model}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Year</span>
                                <span className="info-value">{car.year}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Fuel Type</span>
                                <span className="info-value">{car.fuelType}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Transmission</span>
                                <span className="info-value">{car.transmissionType || 'Manual'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Body Type</span>
                                <span className="info-value">{car.bodyType || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Kilometers</span>
                                <span className="info-value">{car.kilometers?.toLocaleString()} km</span>
                            </div>
                        </div>
                    </div>

                    {/* Ownership Details Grid */}
                    <div className="detail-group">
                        <h3>Ownership Details</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Registration (RTO)</span>
                                <span className="info-value">{car.registrationRTO || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Ownership</span>
                                <span className="info-value">{car.owners} Owner</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Seating Capacity</span>
                                <span className="info-value">{car.seatingCapacity || 'N/A'} Seater</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Color</span>
                                <span className="info-value" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                                    <span className="color-dot" style={{backgroundColor: car.color}}></span>
                                    {car.color}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="detail-group">
                        <h3>Additional Information</h3>
                        <div className="additional-info-grid">
                            <div className="info-item-full">
                                <span className="info-label">Car Description</span>
                                <p className="info-text">{(car.description && typeof car.description === 'object' ? (car.description[language] || car.description['en']) : car.description) || 'No description available.'}</p>
                            </div>
                            <div className="info-item-full">
                                <span className="info-label">Condition Details</span>
                                <p className="info-text">{car.condition || 'Good condition, well maintained.'}</p>
                            </div>
                            <div className="info-item-full">
                                <span className="info-label">Insurance Information</span>
                                <p className="info-text">{car.insuranceInfo || 'Available'}</p>
                            </div>
                            <div className="info-item-full">
                                <span className="info-label">Service History</span>
                                <p className="info-text">{car.serviceHistory || 'Available'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons-group">
                        {car.status === 'available' ? (
                            <button 
                                className="btn-book-now"
                                onClick={() => setShowBookingModal(true)}
                            >
                                {t('bookNow') || 'Book Now'}
                            </button>
                        ) : (
                            <div className="sold-notice">
                                {car.status === 'sold' ? 'This vehicle has already been sold.' : 'This vehicle is currently not available.'}
                            </div>
                        )}
                        
                        <div className="secondary-actions">
                            <button 
                                className={`btn-wishlist ${isWishlisted ? 'active' : ''}`} 
                                onClick={addToWishlist}
                                title="Add to Wishlist"
                            >
                                {isWishlisted ? <WishlistFillIcon fill="#ef4444" /> : <WishlistIcon />}
                                <span>{isWishlisted ? 'Saved' : 'Save'}</span>
                            </button>
                            
                            <div className="share-container">
                                <button className="btn-share" onClick={handleShare} title="Share Link">
                                    <ShareIcon />
                                    <span>Share</span>
                                </button>
                                {showShareTooltip && <div className="share-tooltip">Link Copied!</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
          <div className="modal-overlay">
              <div className="modal-content wide-modal">
                  <div className="modal-header">
                      <h2>{t('bookNow') || 'Book Now'} - {car.brand} {car.model}</h2>
                      <button className="close-btn" onClick={() => setShowBookingModal(false)}>×</button>
                  </div>
                  
                  <div className="booking-modal-layout">
                      {/* Left: Form Section */}
                      <form onSubmit={handleBookingSubmit} className="booking-form-main">
                          <div className="form-scroll-area">
                              <div className="form-section">
                                  <h3>User Information</h3>
                                  <div className="form-row">
                                      <div className="form-group">
                                          <label>Full Name</label>
                                          <input type="text" name="name" required value={bookingData.name} onChange={handleInputChange} placeholder="Full Name" />
                                      </div>
                                      <div className="form-group">
                                          <label>Phone Number</label>
                                          <input type="tel" name="phone" required value={bookingData.phone} onChange={handleInputChange} placeholder="10-digit number" />
                                      </div>
                                  </div>
                                  <div className="form-group">
                                      <label>Email Address</label>
                                      <input type="email" name="email" required value={bookingData.email} onChange={handleInputChange} placeholder="example@mail.com" />
                                  </div>
                                  <div className="form-group">
                                      <label>Complete Address</label>
                                      <textarea name="address" required value={bookingData.address} onChange={handleInputChange} placeholder="House No, Street, Area..." rows="2"></textarea>
                                  </div>
                                  <div className="form-row">
                                      <div className="form-group">
                                          <label>District</label>
                                          <input type="text" name="district" required value={bookingData.district} onChange={handleInputChange} placeholder="District" />
                                      </div>
                                      <div className="form-group">
                                          <label>State</label>
                                          <input type="text" name="state" required value={bookingData.state} onChange={handleInputChange} placeholder="State" />
                                      </div>
                                  </div>
                                  <div className="form-row">
                                      <div className="form-group">
                                          <label>Country</label>
                                          <input type="text" name="country" required value={bookingData.country} onChange={handleInputChange} placeholder="Country" />
                                      </div>
                                      <div className="form-group">
                                          <label>Pincode</label>
                                          <input type="text" name="pincode" required value={bookingData.pincode} onChange={handleInputChange} placeholder="6-digit Pincode" />
                                      </div>
                                  </div>
                              </div>

                              <div className="form-section">
                                  <h3>Visit Information</h3>
                                  <div className="form-row">
                                      <div className="form-group">
                                          <label>Preferred Visiting Date</label>
                                          <input type="date" name="visitDate" required value={bookingData.visitDate} onChange={handleInputChange} min={new Date().toISOString().split('T')[0]} />
                                      </div>
                                      <div className="form-group">
                                          <label>Visiting Time</label>
                                          <input type="time" name="visitTime" required value={bookingData.visitTime} onChange={handleInputChange} />
                                      </div>
                                  </div>

                                  <div className="form-group">
                                      <label>Payment Preference</label>
                                      <select name="paymentPreference" required value={bookingData.paymentPreference} onChange={handleInputChange}>
                                          <option value="No Payment (Visit Only)">No Payment (Visit Only)</option>
                                          <option value="Ready Cost">Ready Cost</option>
                                          <option value="Initial Amount">Initial Amount</option>
                                      </select>
                                  </div>

                                  {bookingData.paymentPreference === 'Initial Amount' && (
                                      <div className="form-group animate-fade-in">
                                          <label>Enter Initial Amount (₹)</label>
                                          <input 
                                              type="number" 
                                              name="initialAmount" 
                                              required 
                                              value={bookingData.initialAmount} 
                                              onChange={handleInputChange} 
                                              placeholder="Minimum ₹5,000"
                                              min="5000"
                                          />
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="modal-footer-fixed">
                              <button type="submit" className="submit-btn">Confirm Booking Request</button>
                          </div>
                      </form>

                      {/* Right: Instructions Section */}
                      <div className="booking-instructions-sidebar">
                          <div className="instruction-card">
                              <div className="instruction-header">
                                  <span className="info-icon">ℹ️</span>
                                  <h3>Booking Instructions</h3>
                              </div>
                              <ul className="instruction-list">
                                  <li>
                                      <strong>Exclusive Reservation:</strong> 
                                      If you select <span>Ready Cost Payment</span>, this vehicle may be reserved exclusively for you pending admin verification.
                                  </li>
                                  <li>
                                      <strong>Booking Queue:</strong> 
                                      Multiple users can express interest. The <span>booking count</span> increases with each request to reflect current demand.
                                  </li>
                                  <li>
                                      <strong>Confirmation:</strong> 
                                      Once our team verifies your details and payment preference, your status will update to <span>"Booking Confirmed"</span>.
                                  </li>
                                  <li>
                                      <strong>Next Steps:</strong> 
                                      Our representative will contact you within 24 hours to finalize the visit and documentation.
                                  </li>
                              </ul>
                              
                              <div className="car-mini-summary">
                                  <h4>Vehicle Summary</h4>
                                  <div className="mini-details">
                                      <div className="mini-item">
                                          <span>Car:</span> <strong>{car.brand} {car.model}</strong>
                                      </div>
                                      <div className="mini-item">
                                          <span>Price:</span> <strong>{formatPrice(car.price)}</strong>
                                      </div>
                                      <div className="mini-item">
                                          <span>Status:</span> <strong className="status-avail">Available</strong>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default CarDetails;
