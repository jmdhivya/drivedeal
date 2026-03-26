import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CarManagement from './admin/CarManagement';
import UserManagement from './admin/UserManagement';
import BookingManagement from './admin/BookingManagement';
import EnquiryManagement from './admin/EnquiryManagement';
import SoldCarManagement from './admin/SoldCarManagement';
import './AdminPanel.css';
import { HomeIcon, DriveDealLogoIcon, AdminIcon, EmailIcon, SettingsIcon, CalendarIcon } from './Icons';

const AdminPanel = () => {
  const { isAdmin, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cars');
  const { theme } = useTheme();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  if (loading) {
    return <div style={{ marginTop: '100px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated || !isAdmin) {
    return null; 
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'cars':
        return <CarManagement />;
      case 'users':
        return <UserManagement />;
      case 'bookings':
        return <BookingManagement />;
      case 'sold':
        return <SoldCarManagement />;
      case 'enquiries':
        return <EnquiryManagement />;
      default:
        return <CarManagement />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveTab('cars')}
          >
            <span className="nav-icon">
              <DriveDealLogoIcon className="nav-icon-svg-car" fill="currentColor" />
            </span>
            <span className="nav-label">Cars</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">
              <AdminIcon className="nav-icon-svg" fill="currentColor" />
            </span>
            <span className="nav-label">Users</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span className="nav-icon">
              <SettingsIcon className="nav-icon-svg" fill="currentColor" />
            </span>
            <span className="nav-label">Bookings</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'sold' ? 'active' : ''}`}
            onClick={() => setActiveTab('sold')}
          >
            <span className="nav-icon">
              <CalendarIcon className="nav-icon-svg" fill="currentColor" />
            </span>
            <span className="nav-label">Sold Cars</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'enquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('enquiries')}
          >
            <span className="nav-icon">
              <EmailIcon className="nav-icon-svg" fill="currentColor" />
            </span>
            <span className="nav-label">Enquiries</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={() => navigate('/')}>
            <span className="nav-icon">
              <HomeIcon className="nav-icon-svg" fill="currentColor" />
            </span>
            <span className="nav-label">Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <h1 className="page-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
          </h1>
          <div className="header-actions">
            <div className="admin-profile">
              <span className="admin-badge">Administrator</span>
            </div>
          </div>
        </header>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
