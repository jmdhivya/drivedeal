import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Profile.css';

const API_BASE = 'http://localhost:5000';

const Profile = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    phone: '',
  });
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    const trim = (s) => (s || '').trim();
    return (
      trim(formData.firstName) !== trim(initialData.firstName) ||
      trim(formData.lastName) !== trim(initialData.lastName) ||
      trim(formData.phone) !== trim(initialData.phone) ||
      trim(formData.location) !== trim(initialData.location)
    );
  }, [formData, initialData]);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      navigate('/');
      return;
    }
    fetchProfile();
    fetchUserActivity();
  }, [isAuthenticated, user?.email, navigate]);

  const deriveNameParts = (name) => {
    if (!name || typeof name !== 'string') return { first: '', last: '' };
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: '' };
    return {
      first: parts[0],
      last: parts.slice(1).join(' '),
    };
  };

  const fetchProfile = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/profile?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.user) {
        const u = data.user;
        const { first, last } = deriveNameParts(u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name);
        const data_ = {
          firstName: u.firstName || first,
          lastName: u.lastName || last,
          email: u.email || '',
          location: u.location || '',
          phone: u.phone || '',
        };
        setFormData(data_);
        setInitialData({ ...data_ });
      } else {
        const { first, last } = deriveNameParts(user.name);
        const data_ = {
          firstName: user.firstName || first,
          lastName: user.lastName || last,
          email: user.email || '',
          location: user.location || '',
          phone: user.phone || '',
        };
        setFormData(data_);
        setInitialData({ ...data_ });
      }
    } catch {
      const { first, last } = deriveNameParts(user.name);
      const data_ = {
        firstName: user.firstName || first,
        lastName: user.lastName || last,
        email: user.email || '',
        location: user.location || '',
        phone: user.phone || '',
      };
      setFormData(data_);
      setInitialData({ ...data_ });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    if (!user?.email || !user?._id) return;
    try {
      const [enqRes, bookingRes, wishlistRes] = await Promise.all([
        fetch(`${API_BASE}/api/enquiries?email=${encodeURIComponent(user.email)}`),
        fetch(`${API_BASE}/api/bookings?email=${encodeURIComponent(user.email)}`),
        fetch(`${API_BASE}/api/wishlist/${user._id}`),
      ]);
      const [enqData, bookingData, wishlistData] = await Promise.all([
        enqRes.json(),
        bookingRes.json(),
        wishlistRes.json()
      ]);
      if (enqData.success && Array.isArray(enqData.data)) {
        setEnquiries(enqData.data);
      }
      if (bookingData.success && Array.isArray(bookingData.data)) {
        setBookings(bookingData.data);
      }
      if (wishlistData.success && Array.isArray(wishlistData.data)) {
        setWishlistCount(wishlistData.data.length);
      }
    } catch {
      // fail silently; activity is non-critical
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loggedInEmail = user?.email;
    if (!loggedInEmail || saving || !hasChanges) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    const payload = {
      email: loggedInEmail,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      location: formData.location.trim(),
      phone: formData.phone.trim(),
    };
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': loggedInEmail,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.user) {
        updateUser(data.user);
        setInitialData({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: data.user.email,
          location: payload.location,
          phone: payload.phone,
        });
        setMessage({ type: 'success', text: t('profileUpdated') });
      } else {
        setMessage({ type: 'error', text: data.message || t('profileUpdateFailed') });
      }
    } catch {
      setMessage({ type: 'error', text: t('profileUpdateFailed') });
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return null;
  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">{t('loading') || 'Loading...'}</div>
      </div>
    );
  }

  const handleViewInfo = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowModal(true);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Detail Modal */}
        {showModal && selectedItem && (
          <div className="detail-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="detail-modal-content" onClick={e => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h2>{selectedItem.type === 'enquiry' ? 'Enquiry Details' : 'Booking Details'}</h2>
                <button className="detail-modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="detail-list">
                {selectedItem.type === 'enquiry' ? (
                  <>
                    <div className="detail-row">
                      <span className="label">Car / Interest</span>
                      <span className="value">
                        {selectedItem.preferredBrand || selectedItem.preferredModel
                          ? `${selectedItem.preferredBrand || ''} ${selectedItem.preferredModel || ''}`.trim()
                          : 'General enquiry'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Budget Range</span>
                      <span className="value">{selectedItem.budgetRange || 'Not specified'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Message</span>
                      <div className="value description">{selectedItem.message}</div>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status</span>
                      <span className={`status-pill status-${selectedItem.status.toLowerCase()}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-row">
                      <span className="label">Vehicle</span>
                      <span className="value">
                        {selectedItem.carId ? `${selectedItem.carId.brand} ${selectedItem.carId.model}` : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Visit Schedule</span>
                      <span className="value">
                        {new Date(selectedItem.visitDate).toLocaleDateString()} at {selectedItem.visitTime}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Payment Preference</span>
                      <span className="value">{selectedItem.paymentPreference}</span>
                    </div>
                    {selectedItem.initialAmount && (
                      <div className="detail-row">
                        <span className="label">Initial Amount</span>
                        <span className="value">₹{selectedItem.initialAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="label">Booking Status</span>
                      <span className={`status-pill status-${selectedItem.status.toLowerCase()}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </>
                )}
                <div className="detail-row">
                  <span className="label">Date Submitted</span>
                  <span className="value">
                    {new Date(selectedItem.createdAt || selectedItem.bookingDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="profile-dashboard-header">
          <div className="header-info">
            <h1 className="profile-title">{t('yourProfile')}</h1>
            <p className="profile-subtitle">
              {t('editProfileSubtitle') || 'View and edit your account information'}
            </p>
          </div>
          <div className="header-actions">
            {!isEditing ? (
              <button
                type="button"
                className="profile-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => {
                  setFormData(initialData || formData);
                  setIsEditing(false);
                  setMessage({ type: '', text: '' });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="profile-stats-row">
          <div className="stat-card">
            <div className="stat-value">{enquiries.length}</div>
            <div className="stat-label">Enquiries</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{bookings.length}</div>
            <div className="stat-label">Bookings</div>
          </div>
          <div 
            className="stat-card clickable" 
            onClick={() => navigate('/wishlist')}
          >
            <div className="stat-value">{wishlistCount}</div>
            <div className="stat-label">Wishlist</div>
          </div>
        </div>

        <div className="profile-main-grid">
          {/* Left Column: Form */}
          <div className="profile-card info-section">
            <h2 className="section-title">Personal Information</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row-2">
                <div className="profile-field">
                  <label htmlFor="firstName">{t('firstName')}</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder={t('firstName')}
                    readOnly={!isEditing}
                    className={!isEditing ? 'profile-input-readonly' : ''}
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="lastName">{t('lastName')}</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder={t('lastName')}
                    readOnly={!isEditing}
                    className={!isEditing ? 'profile-input-readonly' : ''}
                  />
                </div>
              </div>

              <div className="profile-field">
                <label htmlFor="email">{t('email')}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="profile-input-readonly"
                />
                <span className="field-hint">
                  {t('emailNotEditable') || 'Email cannot be changed'}
                </span>
              </div>

              <div className="profile-field">
                <label htmlFor="phone">{t('phone')}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('phone')}
                  readOnly={!isEditing}
                  className={!isEditing ? 'profile-input-readonly' : ''}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="location">{t('location')}</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('locationPlaceholder') || 'City, State or Region'}
                  readOnly={!isEditing}
                  className={!isEditing ? 'profile-input-readonly' : ''}
                />
              </div>

              {message.text && (
                <div className={`profile-message message-${message.type}`}>
                  {message.text}
                </div>
              )}

              {isEditing && (
                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={saving || !hasChanges}
                >
                  {saving ? (t('saving') || 'Saving...') : t('save')}
                </button>
              )}
            </form>
          </div>

          {/* Right Column: Activity Summary */}
          <div className="profile-activity-column">
            <div className="profile-card activity-section">
              <h2 className="section-title">Enquiries</h2>
              {enquiries.length === 0 ? (
                <div className="empty-state">
                  <p>You have not submitted any enquiries yet.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {enquiries.map((enq) => (
                    <div key={enq._id} className="activity-item">
                      <div className="activity-info">
                        <span className="activity-name">
                          {enq.preferredBrand || enq.preferredModel
                            ? `${enq.preferredBrand || ''} ${enq.preferredModel || ''}`.trim()
                            : 'General enquiry'}
                        </span>
                        <span className="activity-date">
                          {new Date(enq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="activity-actions">
                        <span className={`status-pill status-${enq.status.toLowerCase()}`}>
                          {enq.status}
                        </span>
                        <button 
                          className="btn-view-info"
                          onClick={() => handleViewInfo(enq, 'enquiry')}
                        >
                          View Info
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-card activity-section">
              <h2 className="section-title">Bookings</h2>
              {bookings.length === 0 ? (
                <div className="empty-state">
                  <p>You have not booked any cars yet.</p>
                </div>
              ) : (
                <div className="activity-list">
                  {bookings.map((b) => (
                    <div key={b._id} className="activity-item">
                      <div className="activity-info">
                        <span className="activity-name">
                          {b.carId ? `${b.carId.brand} ${b.carId.model}` : 'Car booking'}
                        </span>
                        <span className="activity-date">
                          {new Date(b.bookingDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="activity-actions">
                        <span className={`status-pill status-${b.status.toLowerCase()}`}>
                          {b.status === 'Pending' ? 'Pending Approval' : b.status}
                        </span>
                        <button 
                          className="btn-view-info"
                          onClick={() => handleViewInfo(b, 'booking')}
                        >
                          View Info
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
