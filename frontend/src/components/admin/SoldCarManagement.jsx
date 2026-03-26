import React, { useState, useEffect } from 'react';
import { SearchIcon, CloseIcon, CalendarIcon } from '../Icons';

const SoldCarManagement = () => {
  const [soldCars, setSoldCars] = useState([]);
  const [filteredSoldCars, setFilteredSoldCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSoldCars();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [soldCars, searchTerm, dateFilter]);

  const fetchSoldCars = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/sold-cars');
      const data = await response.json();
      if (data.success) {
        setSoldCars(data.data);
        setFilteredSoldCars(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error fetching sold cars:', err);
      setError('Failed to load sold car records');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...soldCars];

    // 1. Global Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.buyerName && item.buyerName.toLowerCase().includes(lowerTerm)) ||
        (item.buyerEmail && item.buyerEmail.toLowerCase().includes(lowerTerm)) ||
        (item.buyerPhone && item.buyerPhone.includes(lowerTerm)) ||
        (item.carName && item.carName.toLowerCase().includes(lowerTerm)) ||
        (item.carModel && item.carModel.toLowerCase().includes(lowerTerm)) ||
        (item.buyerDistrict && item.buyerDistrict.toLowerCase().includes(lowerTerm))
      );
    }

    // 2. Date Filter
    if (dateFilter.startDate) {
      const start = new Date(dateFilter.startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(item => new Date(item.saleDate) >= start);
    }
    if (dateFilter.endDate) {
      const end = new Date(dateFilter.endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => new Date(item.saleDate) <= end);
    }

    setFilteredSoldCars(result);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
  };

  const openDetailModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedRecord(null), 300);
    document.body.style.overflow = 'unset';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Sold Cars Records</h2>
        <span className="admin-badge">
            Total Sales: {filteredSoldCars.length} / {soldCars.length}
        </span>
      </div>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="search-bar-container">
          <SearchIcon className="search-icon-absolute" fill="currentColor" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search by buyer, car, email, district..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-grid">
            <div className="filter-group">
                <label className="filter-label">Sale Date Range</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="date-input-wrapper">
                        <CalendarIcon className="date-icon" fill="currentColor" />
                        <input 
                            type="date" 
                            className="filter-input date-input" 
                            value={dateFilter.startDate}
                            onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                        />
                    </div>
                    <span className="text-secondary">to</span>
                    <div className="date-input-wrapper">
                        <CalendarIcon className="date-icon" fill="currentColor" />
                        <input 
                            type="date" 
                            className="filter-input date-input" 
                            value={dateFilter.endDate}
                            onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                        />
                    </div>
                </div>
            </div>
        </div>

        <button className="reset-filters-btn" onClick={resetFilters}>
            <CloseIcon style={{ width: '15px', height: '15px', marginRight: '4px', verticalAlign: 'text-bottom' }} fill="currentColor" />
            Reset Filters
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="admin-table-container">
            <table className="admin-table">
            <thead>
                <tr>
                <th>Sale Date</th>
                <th>Car Details</th>
                <th>Buyer Information</th>
                <th>Sale Price</th>
                <th>Payment</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredSoldCars.length > 0 ? (
                filteredSoldCars.map(record => (
                    <tr key={record._id}>
                    <td>{new Date(record.saleDate).toLocaleDateString()}</td>
                    <td>
                        <div className="text-primary" style={{ fontWeight: '600' }}>{record.carName} {record.carModel}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>ID: {record.carId?._id?.substring(0, 8) || 'N/A'}</div>
                    </td>
                    <td>
                        <div className="text-secondary" style={{ fontWeight: '500' }}>{record.buyerName}</div>
                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{record.buyerPhone}</div>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--success)' }}>₹{record.salePrice.toLocaleString()}</td>
                    <td>{record.paymentMethod}</td>
                    <td>
                        <button className="action-btn btn-view" onClick={() => openDetailModal(record)}>
                            View Details
                        </button>
                    </td>
                    </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan="6" className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                            No sold car records found.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedRecord && (
        <div className="modal-overlay" onClick={closeDetailModal}>
            <div className="modal-content-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Sales Record: {selectedRecord.carName}</h2>
                    <button className="modal-close-btn" onClick={closeDetailModal}>
                        <CloseIcon fill="currentColor" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="detail-section">
                        <h3>Buyer Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Name</span>
                                <span className="detail-value">{selectedRecord.buyerName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{selectedRecord.buyerEmail}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">{selectedRecord.buyerPhone}</span>
                            </div>
                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                <span className="detail-label">Address</span>
                                <span className="detail-value">{selectedRecord.buyerAddress}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">District</span>
                                <span className="detail-value">{selectedRecord.buyerDistrict}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">State</span>
                                <span className="detail-value">{selectedRecord.buyerState}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Country</span>
                                <span className="detail-value">{selectedRecord.buyerCountry}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Transaction Details</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Vehicle</span>
                                <span className="detail-value">{selectedRecord.carName} {selectedRecord.carModel}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Sale Price</span>
                                <span className="detail-value" style={{ color: 'var(--success)', fontWeight: '700' }}>₹{selectedRecord.salePrice.toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Sale Date</span>
                                <span className="detail-value">{new Date(selectedRecord.saleDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Payment Method</span>
                                <span className="detail-value">{selectedRecord.paymentMethod}</span>
                            </div>
                        </div>
                    </div>

                    {selectedRecord.additionalNotes && (
                        <div className="detail-section">
                            <h3>Additional Notes</h3>
                            <div className="detail-message">
                                {selectedRecord.additionalNotes}
                            </div>
                        </div>
                    )}
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

export default SoldCarManagement;