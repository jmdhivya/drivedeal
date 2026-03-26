import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { WishlistIcon, LogoutIcon, LoginIcon, AdminIcon, SettingsIcon, MenuIcon, SearchIcon, SunIcon, MoonIcon } from './Icons';

const Navbar = () => {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const auth = useAuth();
  const {
    user,
    isAdmin,
    isAuthenticated,
    logout,
    loginWithGoogle,
    getUserInitial,
    signup,
    loginWithEmailPassword,
    adminLogin,
  } = auth;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cars?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Close sidebar when clicking outside
  const sidebarRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeSidebar();
      }
    };
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);
  const [activeModal, setActiveModal] = useState(null); // 'login', 'signup', 'admin', 'forgot'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const openModal = (modalName) => {
    setActiveModal(modalName);
    setFormError('');
    setFormSuccess('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: '',
    });
  };

  const userMenuRef = useRef(null);
  const languageMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target)
      ) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    // Check for Admin Credentials
    if (formData.email === 'drivedeal@admin.com') {
      const adminResult = await adminLogin(formData.email, formData.password);
      if (adminResult.success) {
        setActiveModal(null);
        navigate('/admin');
        return;
      }
    }

    const result = await loginWithEmailPassword(formData.email, formData.password);
    if (result.success) {
      setActiveModal(null);
    } else {
      setFormError(result.error);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setFormError('passwordMismatch');
      return;
    }
    const result = await signup({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });
    if (result.success) {
      setFormSuccess('signupSuccess');
      setTimeout(() => {
        setActiveModal('login');
        setFormSuccess('');
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }, 2000);
    } else {
      setFormError(result.error);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    const result = await adminLogin(formData.email, formData.password);
    if (result.success) {
      setActiveModal(null);
      navigate('/admin');
    } else {
      setFormError(result.error);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setFormSuccess('passwordResetSent');
    setTimeout(() => setActiveModal('login'), 3000);
  };



  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'te', name: 'తెలుగు' },
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    if (window.location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={closeSidebar}></div>
      <div className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`} ref={sidebarRef}>
        <div className="sidebar-header">
          <div className="sidebar-logo">DRIVEDEAL</div>
          <button className="sidebar-close" onClick={closeSidebar}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); closeSidebar(); }} className="sidebar-link">{t('home')}</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cars'); closeSidebar(); }} className="sidebar-link">{t('cars')}</a>
          {/* <a href="#compare" onClick={closeSidebar} className="sidebar-link">{t('compare')}</a> */}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/enquiry'); closeSidebar(); }} className="sidebar-link">{t('customerEnquiry')}</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); closeSidebar(); }} className="sidebar-link">{t('about')}</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); closeSidebar(); }} className="sidebar-link">{t('contact')}</a>
          <div className="sidebar-divider"></div>
          {!isAuthenticated ? (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); openModal('login'); closeSidebar(); }} className="sidebar-link">{t('login')}</a>
              <a href="#" onClick={(e) => { e.preventDefault(); openModal('signup'); closeSidebar(); }} className="sidebar-link">{t('signUp')}</a>
            </>
          ) : (
            <button onClick={() => { handleLogout(); closeSidebar(); }} className="sidebar-link btn-logout">{t('logout')}</button>
          )}
        </nav>
      </div>

      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo Section */}
          <div className="navbar-logo-section">
            <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
              <MenuIcon className="menu-icon-svg" />
            </button>
            <div className="navbar-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <span className="logo-icon-text"></span>
            <div className="logo-text">
              <span className="logo-full">DRIVEDEAL</span>
              <span className="logo-short">DRIVEDEAL</span>
            </div>
          </div>
          </div>

          {/* Search Bar (Replaces Desktop Menu) */}
          <div className="navbar-search-container">
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <SearchIcon className="search-input-icon" />
              <input 
                type="text" 
                className="navbar-search-input" 
                placeholder="Search by brand, model, fuel type..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="navbar-actions">
            {/* Theme Toggle */}
            <button
              className="icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <MoonIcon className="icon-svg large-icon" />
              ) : (
                <SunIcon className="icon-svg large-icon" />
              )}
            </button>

            {/* Google Translate Container */}
            <div id="google_translate_element" className="google-translate-container"></div>

            {/* Language Selector */}
            {/* <div className="language-selector" ref={languageMenuRef}>
              <button
                className="language-btn"
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                aria-label="Select Language"
              >
                <span className="language-code">
                  {languages.find((lang) => lang.code === language)?.code.toUpperCase()}
                </span>
                <span className="chevron-icon-text">▼</span>
              </button>
              {isLanguageMenuOpen && (
                <div className="language-dropdown">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`language-option ${
                        language === lang.code ? 'active' : ''
                      }`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div> */}

            {/* Wishlist Icon */}
            {isAuthenticated && (
              <button
                className="icon-btn wishlist-btn"
                onClick={() => navigate('/wishlist')}
                aria-label={t('wishlist')}
                title={t('wishlist')}
              >
                <WishlistIcon className="icon-svg large-icon" fill="currentColor" />
              </button>
            )}

            {/* User Menu or Login/Signup */}
            {isAuthenticated ? (
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  className="user-avatar-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-label="User Menu"
                >
                  <div className="user-avatar">
                    {getUserInitial()}
                  </div>
                  <span className="chevron-icon-text">▼</span>
                </button>
                {isUserMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-avatar-small">
                        {getUserInitial()}
                      </div>
                      <div className="user-details">
                        <p className="user-name">
                          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'User'}
                        </p>
                        <p className="user-email">{user?.email || ''}</p>
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/wishlist');
                      }}
                    >
                      <WishlistIcon className="dropdown-icon-svg" fill="currentColor" />
                      <span>{t('wishlist')}</span>
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <SettingsIcon className="dropdown-icon-svg" fill="currentColor" />
                      <span>{t('yourProfile')}</span>
                    </button>
                    {isAdmin && (
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/admin');
                        }}
                      >
                        <AdminIcon className="dropdown-icon-svg" fill="currentColor" />
                        <span>{t('adminPanel')}</span>
                      </button>
                    )}
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <LogoutIcon className="dropdown-icon-svg" fill="currentColor" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <button
                  className="btn-admin-nav"
                  onClick={() => openModal('admin')}
                >
                  <AdminIcon className="btn-icon-svg" fill="currentColor" />
                  <span>Admin</span>
                </button>
                <button
                  className="btn-login"
                  onClick={() => openModal('login')}
                >
                  <LoginIcon className="btn-icon-svg" fill="currentColor" />
                  <span>{t('login')}</span>
                </button>
                <button
                  className="btn-signup"
                  onClick={() => openModal('signup')}
                >
                  <span className="btn-icon-text"></span>
                  <span>{t('signUp')}</span>
                </button>
              </div>
            )}


          </div>
        </div>


      </nav>

      {/* Auth Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setActiveModal(null)}
              aria-label="Close"
            >
              <span className="icon-text">✕</span>
            </button>

            {/* LOGIN MODAL */}
            {activeModal === 'login' && (
              <>
                <h2>{t('login')}</h2>
                {formError && (
                  <div className="error-message">{t(formError) || formError}</div>
                )}
                {formSuccess && (
                  <div className="success-message">
                    {t(formSuccess) || formSuccess}
                  </div>
                )}
                <form className="login-form" onSubmit={handleLoginSubmit}>
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
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <a
                    href="#forgot-password"
                    className="forgot-password-link"
                    onClick={(e) => {
                      e.preventDefault();
                      openModal('forgot');
                    }}
                  >
                    {t('forgotPassword')}
                  </a>
                  <button type="submit" className="btn-primary">
                    {t('login')}
                  </button>
                  <div className="divider">
                    <span>or</span>
                  </div>
                  <button
                    type="button"
                    className="btn-google"
                    onClick={() => {
                      loginWithGoogle();
                      setActiveModal(null);
                    }}
                  >
                    <span className="btn-icon-text">G</span>
                    <span>{t('continueWithGoogle')}</span>
                  </button>
                </form>
                <div className="auth-switch" style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <span>Don't have an account? </span>
                  <button
                    className="text-btn"
                    onClick={() => openModal('signup')}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {t('signUp')}
                  </button>
                </div>
              </>
            )}

            {/* SIGNUP MODAL */}
            {activeModal === 'signup' && (
              <>
                <h2>{t('signUp')}</h2>
                {formError && (
                  <div className="error-message">{t(formError) || formError}</div>
                )}
                <form className="login-form" onSubmit={handleSignupSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">{t('fullName')}</label>
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
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    {t('signUp')}
                  </button>
                  <div className="divider">
                    <span>or</span>
                  </div>
                  <button
                    type="button"
                    className="btn-google"
                    onClick={() => {
                      loginWithGoogle();
                      setActiveModal(null);
                    }}
                  >
                    <span className="btn-icon-text">G</span>
                    <span>{t('continueWithGoogle')}</span>
                  </button>
                </form>
                <div className="auth-switch" style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <span>Already have an account? </span>
                  <button
                    className="text-btn"
                    onClick={() => openModal('login')}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {t('login')}
                  </button>
                </div>
              </>
            )}

            {/* ADMIN MODAL */}
            {activeModal === 'admin' && (
              <>
                <h2>{t('adminLogin')}</h2>
                {formError && (
                  <div className="error-message">{t(formError) || formError}</div>
                )}
                <form className="login-form" onSubmit={handleAdminLoginSubmit}>
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
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    {t('loginAsAdmin')}
                  </button>
                </form>
                <div className="auth-switch" style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    className="text-btn"
                    onClick={() => openModal('login')}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {t('loginAsUser')}
                  </button>
                </div>
              </>
            )}

            {/* FORGOT PASSWORD MODAL */}
            {activeModal === 'forgot' && (
              <>
                <h2>{t('resetPassword')}</h2>
                {formSuccess ? (
                  <div className="success-message">{t(formSuccess)}</div>
                ) : (
                  <form className="login-form" onSubmit={handleForgotPasswordSubmit}>
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
                    <button type="submit" className="btn-primary">
                      {t('sendResetLink')}
                    </button>
                  </form>
                )}
                <div className="auth-switch" style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <button
                    className="text-btn"
                    onClick={() => openModal('login')}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {t('backToLogin')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

