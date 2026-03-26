import React, { useState, useEffect, useCallback } from 'react';
import { SearchIcon, CloseIcon, CalendarIcon } from '../Icons';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userWishlist, setUserWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setFilteredUsers(data.data);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUsers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchUsers]);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, dateFilter]);

  const applyFilters = () => {
    let result = [...users];

    // 1. Global Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      const displayName = (item) => [item.firstName, item.lastName].filter(Boolean).join(' ') || item.name || '';
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
        (displayName(item) && displayName(item).toLowerCase().includes(lowerTerm)) ||
        (item.firstName && item.firstName.toLowerCase().includes(lowerTerm)) ||
        (item.lastName && item.lastName.toLowerCase().includes(lowerTerm)) ||
        (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
        (item.phone && item.phone && item.phone.includes(lowerTerm)) ||
        (item.location && item.location.toLowerCase().includes(lowerTerm))
      );
    }

    // 2. Date Filter (Joined Date)
    if (dateFilter.startDate) {
      const start = new Date(dateFilter.startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(item => new Date(item.createdAt) >= start);
    }
    if (dateFilter.endDate) {
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => new Date(item.createdAt) <= end);
    }

    setFilteredUsers(result);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
  };

  const fetchUserWishlist = async (userId) => {
    try {
      setLoadingWishlist(true);
      const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUserWishlist(data.data);
      }
    } catch (err) {
      console.error('Error fetching user wishlist:', err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const openDetailModal = (user) => {
    setSelectedUser(user);
    setUserWishlist([]);
    fetchUserWishlist(user._id);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
    document.body.style.overflow = 'unset';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 className="page-title">Registered Users</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
            title="Refresh user list"
            style={{ padding: '6px 12px', fontSize: '0.9rem' }}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <span className="admin-badge">
            Total: {filteredUsers.length} / {users.length}
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        {/* Global Search */}
        <div className="search-bar-container">
          <SearchIcon className="search-icon-absolute" fill="currentColor" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by name, email, phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Advanced Filters */}
        <div className="filters-grid">
            <div className="form-group">
                <label>Joined Date Range</label>
                <div className="form-row grid-2">
                  <div className="date-input-wrapper">
                    <CalendarIcon className="date-input-icon" fill="currentColor" />
                    <input 
                        type="date" 
                        className="form-input"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                    />
                  </div>
                  <div className="date-input-wrapper">
                    <CalendarIcon className="date-input-icon" fill="currentColor" />
                    <input 
                        type="date" 
                        className="form-input"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>to</div>
            </div>
        </div>

        <button className="btn btn-secondary" onClick={resetFilters}>
            <CloseIcon style={{ width: '16px', height: '16px', marginRight: '4px', verticalAlign: 'text-bottom' }} fill="currentColor" />
            Reset Filters
        </button>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <div className="admin-table-container">
            <table className="admin-table">
            <thead>
                <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                <tr key={user._id}>
                    <td>
                        <div className="text-primary" style={{ fontWeight: '600' }}>
                          {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.name}
                        </div>
                    </td>
                    <td>
                        <a href={`mailto:${user.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{user.email}</a>
                    </td>
                    <td>{user.phone || '-'}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>
                        <button className="action-btn btn-view" onClick={() => openDetailModal(user)} title="View Details">
                            View
                        </button>
                    </td>
                </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan="5" className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                            No users found matching your filters.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeDetailModal}>
            <div className="modal-content-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>User Details</h2>
                    <button className="modal-close-btn" onClick={closeDetailModal}>
                        <CloseIcon fill="currentColor" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="detail-section">
                        <h3>Personal Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Full Name</span>
                                <span className="detail-value">
                                  {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.name}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email Address</span>
                                <span className="detail-value">{selectedUser.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone Number</span>
                                <span className="detail-value">{selectedUser.phone || 'N/A'}</span>
                            </div>
                            {selectedUser.location && (
                            <div className="detail-item">
                                <span className="detail-label">Location</span>
                                <span className="detail-value">{selectedUser.location}</span>
                            </div>
                            )}
                            <div className="detail-item">
                                <span className="detail-label">Account Created</span>
                                <span className="detail-value">
                                    {new Date(selectedUser.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3>User Wishlist</h3>
                            <span className="admin-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                                {userWishlist.length} {userWishlist.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>
                        
                        {loadingWishlist ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner"></div></div>
                        ) : userWishlist.length > 0 ? (
                            <div className="wishlist-admin-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                {userWishlist.map((item) => {
                                    const car = item.carId;
                                    if (!car) return null;
                                    return (
                                        <div key={item._id} className="wishlist-admin-item" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-body)' }}>
                                            <div style={{ height: '120px', overflow: 'hidden' }}>
                                                <img 
                                                    src={car.primaryImage ? `http://localhost:5000/${car.primaryImage}` : 'https://via.placeholder.com/200x120?text=No+Image'} 
                                                    alt={car.model} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ padding: '10px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{car.brand} {car.model}</div>
                                                <div style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem', marginTop: '4px' }}>
                                                    ₹{car.price?.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                                This user has no cars in their wishlist.
                            </p>
                        )}
                    </div>
                </div>
                <div className="modal-footer" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={closeDetailModal}>
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
