import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SearchIcon, FilterIcon, CloseIcon, CalendarIcon, DownloadIcon } from '../Icons';

const EnquiryManagement = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [userFilter, setUserFilter] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });
  const [carFilter, setCarFilter] = useState({
    brand: '',
    model: ''
  });
  
  // Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [enquiries, searchTerm, dateFilter, userFilter, carFilter]);

  const fetchEnquiries = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/enquiries');
      const data = await response.json();
      if (data.success) {
        // Sort by date descending (newest first)
        const sortedData = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEnquiries(sortedData);
        setFilteredEnquiries(sortedData);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...enquiries];

    // 1. Global Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
        (item.email && item.email.toLowerCase().includes(lowerTerm)) ||
        (item.phone && item.phone.includes(lowerTerm)) ||
        (item.preferredBrand && item.preferredBrand.toLowerCase().includes(lowerTerm)) ||
        (item.preferredModel && item.preferredModel.toLowerCase().includes(lowerTerm)) ||
        (item.message && item.message.toLowerCase().includes(lowerTerm))
      );
    }

    // 2. Date Filtering
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

    // 3. User Info Filter
    if (userFilter.name) {
      result = result.filter(item => item.name && item.name.toLowerCase().includes(userFilter.name.toLowerCase()));
    }
    if (userFilter.email) {
      result = result.filter(item => item.email && item.email.toLowerCase().includes(userFilter.email.toLowerCase()));
    }
    if (userFilter.phone) {
      result = result.filter(item => item.phone && item.phone.includes(userFilter.phone));
    }
    if (userFilter.location) {
      result = result.filter(item => item.city && item.city.toLowerCase().includes(userFilter.location.toLowerCase()));
    }

    // 4. Car Brand & Model Filter
    if (carFilter.brand) {
      result = result.filter(item => item.preferredBrand && item.preferredBrand.toLowerCase().includes(carFilter.brand.toLowerCase()));
    }
    if (carFilter.model) {
      result = result.filter(item => item.preferredModel && item.preferredModel.toLowerCase().includes(carFilter.model.toLowerCase()));
    }

    setFilteredEnquiries(result);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setUserFilter({ name: '', email: '', phone: '', location: '' });
    setCarFilter({ brand: '', model: '' });
  };

  const openDetailModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsModalOpen(true);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedEnquiry(null), 300); // Clear after animation
    document.body.style.overflow = 'unset';
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.text('Enquiries Report', 14, 22);

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Records: ${filteredEnquiries.length}`, 14, 35);

    // Define columns
    const tableColumn = ["Date", "Name", "Contact", "Location", "Car Interest", "Status", "Message"];
    
    // Define rows
    const tableRows = [];

    filteredEnquiries.forEach(enquiry => {
      const enquiryData = [
        new Date(enquiry.createdAt).toLocaleDateString(),
        enquiry.name,
        `${enquiry.phone}\n${enquiry.email}`,
        enquiry.city || '-',
        `${enquiry.preferredBrand || ''} ${enquiry.preferredModel || ''}`.trim() || 'General',
        enquiry.status || 'New',
        (enquiry.message || '').substring(0, 50) + ((enquiry.message || '').length > 50 ? '...' : '')
      ];
      tableRows.push(enquiryData);
    });

    // Generate table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' }, // Blue-600
      columnStyles: {
        0: { cellWidth: 20 }, // Date
        1: { cellWidth: 25 }, // Name
        2: { cellWidth: 35 }, // Contact
        3: { cellWidth: 20 }, // Location
        4: { cellWidth: 25 }, // Car Interest
        5: { cellWidth: 20 }, // Status
        6: { cellWidth: 'auto' } // Message
      },
      alternateRowStyles: { fillColor: [249, 250, 251] }, // Gray-50
    });

    // Save
    doc.save(`Enquiries_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusClass = (status) => {
    switch ((status || 'New').toLowerCase()) {
      case 'new': return 'status-new';
      case 'contacted': return 'status-contacted';
      case 'closed': return 'status-closed';
      default: return 'status-new';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="page-title">Customer Enquiries</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleDownloadPDF}
            className="btn-success"
          >
            <DownloadIcon fill="currentColor" style={{ width: '18px', height: '18px' }} />
            Download PDF
          </button>
          <span className="admin-badge">
            Total: {filteredEnquiries.length} / {enquiries.length}
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
            placeholder="Search by name, email, phone, car, or message..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Advanced Filters */}
        <div className="filters-grid">
          {/* Date Filter */}
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
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

          {/* User Info Filters */}
          <div className="filter-group">
            <label className="filter-label">Customer Details</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Name"
                value={userFilter.name}
                onChange={(e) => setUserFilter({...userFilter, name: e.target.value})}
              />
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Location"
                value={userFilter.location}
                onChange={(e) => setUserFilter({...userFilter, location: e.target.value})}
              />
            </div>
          </div>

          {/* Car Filters */}
          <div className="filter-group">
            <label className="filter-label">Car Interest</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Brand"
                value={carFilter.brand}
                onChange={(e) => setCarFilter({...carFilter, brand: e.target.value})}
              />
              <input 
                type="text" 
                className="filter-input" 
                placeholder="Model"
                value={carFilter.model}
                onChange={(e) => setCarFilter({...carFilter, model: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button className="reset-filters-btn" onClick={resetFilters}>
            <CloseIcon style={{ width: '16px', height: '16px', marginRight: '4px', verticalAlign: 'text-bottom' }} fill="currentColor" />
            Reset Filters
        </button>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner"></div></div>
      ) : (
        <div className="admin-table-container">
            <table className="admin-table">
            <thead>
                <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Car Interest</th>
                <th>Message</th>
                <th>Status</th>
                <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {filteredEnquiries.length > 0 ? (
                    filteredEnquiries.map(enquiry => (
                    <tr key={enquiry._id} className="enquiry-row">
                        <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                            {new Date(enquiry.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td>
                            <div className="text-primary" style={{ fontWeight: '600' }}>{enquiry.name}</div>
                            {enquiry.city && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{enquiry.city}</div>}
                        </td>
                        <td>
                        <div className="text-secondary" style={{ fontSize: '0.9rem' }}>{enquiry.phone}</div>
                        <a href={`mailto:${enquiry.email}`} style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>{enquiry.email}</a>
                        </td>
                        <td>
                            {enquiry.preferredBrand || enquiry.preferredModel ? (
                                <div className="text-primary" style={{ fontSize: '0.9rem' }}>
                                    <span style={{ fontWeight: '500' }}>{enquiry.preferredBrand || 'Any'}</span>
                                    {enquiry.preferredModel && <span className="text-muted"> - {enquiry.preferredModel}</span>}
                                </div>
                            ) : (
                                <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>General Enquiry</span>
                            )}
                        </td>
                        <td style={{ maxWidth: '250px' }}>
                            <div className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {enquiry.message}
                            </div>
                        </td>
                        <td>
                        <span className={`status-badge ${getStatusClass(enquiry.status)}`}>
                            {enquiry.status || 'New'}
                        </span>
                        </td>
                        <td>
                            <button 
                                className="action-btn btn-primary" 
                                onClick={() => openDetailModal(enquiry)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                View
                            </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                            No enquiries found matching your filters.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedEnquiry && (
        <div className="modal-overlay" onClick={closeDetailModal}>
            <div className="modal-content-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Enquiry Details</h2>
                    <button className="modal-close-btn" onClick={closeDetailModal}>
                        <CloseIcon fill="currentColor" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="detail-section">
                        <h3>Customer Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Full Name</span>
                                <span className="detail-value">{selectedEnquiry.name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Email Address</span>
                                <span className="detail-value">{selectedEnquiry.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone Number</span>
                                <span className="detail-value">{selectedEnquiry.phone}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Location</span>
                                <span className="detail-value">{selectedEnquiry.city || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Submitted Date</span>
                                <span className="detail-value">{formatDate(selectedEnquiry.createdAt)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status</span>
                                <div>
                                    <span className={`status-badge ${getStatusClass(selectedEnquiry.status)}`}>
                                        {selectedEnquiry.status || 'New'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Enquiry Details</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Interested Brand</span>
                                <span className="detail-value">{selectedEnquiry.preferredBrand || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Interested Model</span>
                                <span className="detail-value">{selectedEnquiry.preferredModel || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Budget Range</span>
                                <span className="detail-value">{selectedEnquiry.budgetRange || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Enquiry Type</span>
                                <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                                    {(selectedEnquiry.type || 'general').replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div className="detail-item" style={{ marginTop: '24px' }}>
                            <span className="detail-label">Message</span>
                            <div className="detail-message">
                                {selectedEnquiry.message}
                            </div>
                        </div>
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

export default EnquiryManagement;
