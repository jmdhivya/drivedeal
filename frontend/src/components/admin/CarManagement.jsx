import React, { useState, useEffect } from 'react';
import { DeleteIcon, SearchIcon, FilterIcon, CloseIcon, CalendarIcon } from '../Icons';
import { Reorder } from 'framer-motion';

const CarManagement = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState({
    brand: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    year: '',
    status: ''
  });

  // Modal State
  const [selectedCar, setSelectedCar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    brand: '', model: '', year: '', fuelType: '', color: '',
    price: '', location: '', kilometers: '', owners: '', description: '',
    transmissionType: 'Manual', bodyType: '', registrationRTO: '',
    seatingCapacity: '', insuranceInfo: '', serviceHistory: '', condition: ''
  });
  const [soldFormData, setSoldFormData] = useState({
    buyerName: '', buyerEmail: '', buyerPhone: '', buyerAddress: '',
    buyerDistrict: '', buyerState: '', buyerCountry: 'India',
    salePrice: '', saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash', additionalNotes: ''
  });
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cars, searchTerm, filterCriteria]);

  const fetchCars = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/cars');
      const data = await response.json();
      if (data.success) {
        setCars(data.data);
        setFilteredCars(data.data);
      } else {
        setError('Failed to load cars: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      setError('Error connecting to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSoldSubmit = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            ...soldFormData,
            carId: selectedCar._id,
            carName: selectedCar.brand,
            carModel: selectedCar.model,
            salePrice: Number(soldFormData.salePrice)
        };

        const response = await fetch('http://localhost:5000/api/sold-cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            alert('Car marked as sold successfully!');
            setIsSoldModalOpen(false);
            fetchCars();
            setSoldFormData({
                buyerName: '', buyerEmail: '', buyerPhone: '', buyerAddress: '',
                buyerDistrict: '', buyerState: '', buyerCountry: 'India',
                salePrice: '', saleDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'Cash', additionalNotes: ''
            });
        } else {
            alert('Failed to mark as sold: ' + result.message);
        }
    } catch (error) {
        console.error('Error marking car as sold:', error);
        alert('Error marking car as sold');
    }
  };

  const applyFilters = () => {
    let result = [...cars];

    // 1. Global Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.brand && item.brand.toLowerCase().includes(lowerTerm)) ||
        (item.model && item.model.toLowerCase().includes(lowerTerm)) ||
        (item.fuelType && item.fuelType.toLowerCase().includes(lowerTerm)) ||
        (item.location && item.location.toLowerCase().includes(lowerTerm)) ||
        (item.description && typeof item.description === 'string' && item.description.toLowerCase().includes(lowerTerm)) ||
        (item.description && typeof item.description === 'object' && item.description.en && item.description.en.toLowerCase().includes(lowerTerm))
      );
    }

    // 2. Advanced Filters
    if (filterCriteria.brand) {
      result = result.filter(item => item.brand.toLowerCase().includes(filterCriteria.brand.toLowerCase()));
    }
    if (filterCriteria.model) {
      result = result.filter(item => item.model.toLowerCase().includes(filterCriteria.model.toLowerCase()));
    }
    if (filterCriteria.year) {
      result = result.filter(item => item.year.toString() === filterCriteria.year);
    }
    if (filterCriteria.minPrice) {
      result = result.filter(item => item.price >= Number(filterCriteria.minPrice));
    }
    if (filterCriteria.maxPrice) {
      result = result.filter(item => item.price <= Number(filterCriteria.maxPrice));
    }
    if (filterCriteria.status) {
      result = result.filter(item => item.status && item.status.toLowerCase() === filterCriteria.status.toLowerCase());
    }

    setFilteredCars(result);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCriteria({
      brand: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      year: '',
      status: ''
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSoldInputChange = (e) => {
    setSoldFormData({ ...soldFormData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    setPreviewImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setPreviewImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    // Append images in the order they appear in previewImages
    previewImages.forEach((imageObj) => {
      data.append('images', imageObj.file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/cars', {
        method: 'POST',
        body: data // Don't set Content-Type header, let browser set it with boundary
      });
      const result = await response.json();
      if (result.success) {
        alert('Car added successfully!');
        setShowAddForm(false);
        setFormData({
            brand: '', model: '', year: '', fuelType: '', color: '',
            price: '', location: '', kilometers: '', owners: '', description: '',
            transmissionType: 'Manual', bodyType: '', registrationRTO: '',
            seatingCapacity: '', insuranceInfo: '', serviceHistory: '', condition: ''
        });
        setPreviewImages([]);
        fetchCars();
      } else {
        alert('Failed to add car: ' + result.message);
      }
    } catch (error) {
      console.error('Error adding car:', error);
      alert('Error adding car');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cars/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        fetchCars(); // Refresh list
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteCar = async (id) => {
      if(window.confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
        try {
            const response = await fetch(`http://localhost:5000/api/cars/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                fetchCars();
            }
        } catch (error) {
            console.error('Error deleting car:', error);
        }
      }
  }

  const openDetailModal = (car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedCar(null), 300);
    document.body.style.overflow = 'unset';
  };

  return (
    <div>
      <div className="inventory-header">
        <button
          className="btn-add-new-car"
          onClick={() => setShowAddForm(true)}
        >
          + Add Car
        </button>
        <div className="inventory-header-right">
          <h2 className="page-title">Inventory Overview</h2>
          <span className="admin-badge">
            Total: {filteredCars.length} / {cars.length}
          </span>
        </div>
      </div>

      {showAddForm && (
        <div className="form-container">
          <h3 className="text-primary" style={{ marginTop: 0, marginBottom: '20px' }}>Add New Vehicle</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
                <label className="form-label">Brand</label>
                <input type="text" name="brand" className="form-input" value={formData.brand} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Model</label>
                <input type="text" name="model" className="form-input" value={formData.model} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" name="year" className="form-input" value={formData.year} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <input type="text" name="fuelType" className="form-input" value={formData.fuelType} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Color</label>
                <input type="text" name="color" className="form-input" value={formData.color} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input type="number" name="price" className="form-input" value={formData.price} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Location</label>
                <input type="text" name="location" className="form-input" value={formData.location} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Kilometers Driven</label>
                <input type="number" name="kilometers" className="form-input" value={formData.kilometers} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
                <label className="form-label">Number of Owners</label>
                <input type="number" name="owners" className="form-input" value={formData.owners} onChange={handleInputChange} required />
            </div>

            {/* New Fields */}
            <div className="form-group">
                <label className="form-label">Transmission Type</label>
                <select name="transmissionType" className="form-input" value={formData.transmissionType} onChange={handleInputChange} required>
                    <option value="Manual">Manual</option>
                    <option value="Automatic">Automatic</option>
                </select>
            </div>
            <div className="form-group">
                <label className="form-label">Body Type (e.g., SUV, Sedan)</label>
                <input type="text" name="bodyType" className="form-input" value={formData.bodyType} onChange={handleInputChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Registration (RTO)</label>
                <input type="text" name="registrationRTO" className="form-input" value={formData.registrationRTO} onChange={handleInputChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input type="number" name="seatingCapacity" className="form-input" value={formData.seatingCapacity} onChange={handleInputChange} />
            </div>
            <div className="form-group">
                <label className="form-label">Insurance Info</label>
                <input type="text" name="insuranceInfo" className="form-input" value={formData.insuranceInfo} onChange={handleInputChange} placeholder="e.g., Valid until Dec 2026" />
            </div>
            <div className="form-group">
                <label className="form-label">Service History</label>
                <input type="text" name="serviceHistory" className="form-input" value={formData.serviceHistory} onChange={handleInputChange} placeholder="e.g., Full service history available" />
            </div>
            <div className="form-group">
                <label className="form-label">Condition Details</label>
                <input type="text" name="condition" className="form-input" value={formData.condition} onChange={handleInputChange} placeholder="e.g., Like new, single hand driven" />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <textarea 
                    name="description" 
                    className="form-textarea"
                    value={formData.description} 
                    onChange={handleInputChange} 
                    style={{ minHeight: '100px' }}
                />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Upload Images (Max 10)</label>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)' }} />
              
              {previewImages.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Drag to reorder images</p>
                  <Reorder.Group axis="x" values={previewImages} onReorder={setPreviewImages} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', listStyle: 'none', padding: 0 }}>
                    {previewImages.map((item) => (
                      <Reorder.Item key={item.id} value={item} style={{ position: 'relative', cursor: 'grab' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                          <img src={item.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeImage(item.id)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--danger)',
                            color: 'white',
                            border: '2px solid var(--bg-primary)',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            fontSize: '16px',
                            lineHeight: 1
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary-large" style={{ width: 'auto' }}>Submit Car</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters Section */}
      {!showAddForm && (
        <div className="filters-container">
            {/* Global Search */}
            <div className="search-bar-container">
            <SearchIcon className="search-icon-absolute" fill="#9ca3af" />
            <input 
                type="text" 
                className="search-input" 
                placeholder="Search by brand, model, location, description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>

            {/* Advanced Filters */}
            <div className="filters-grid">
                <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select 
                        className="filter-input"
                        value={filterCriteria.status}
                        onChange={(e) => setFilterCriteria({...filterCriteria, status: e.target.value})}
                    >
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="sold">Sold</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Vehicle Info</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            type="text" 
                            className="filter-input" 
                            placeholder="Brand"
                            value={filterCriteria.brand}
                            onChange={(e) => setFilterCriteria({...filterCriteria, brand: e.target.value})}
                        />
                        <input 
                            type="text" 
                            className="filter-input" 
                            placeholder="Model"
                            value={filterCriteria.model}
                            onChange={(e) => setFilterCriteria({...filterCriteria, model: e.target.value})}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Price Range (₹)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                            type="number" 
                            className="filter-input" 
                            placeholder="Min Price"
                            value={filterCriteria.minPrice}
                            onChange={(e) => setFilterCriteria({...filterCriteria, minPrice: e.target.value})}
                        />
                        <input 
                            type="number" 
                            className="filter-input" 
                            placeholder="Max Price"
                            value={filterCriteria.maxPrice}
                            onChange={(e) => setFilterCriteria({...filterCriteria, maxPrice: e.target.value})}
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Year</label>
                    <input 
                        type="number" 
                        className="filter-input" 
                        placeholder="Year"
                        value={filterCriteria.year}
                        onChange={(e) => setFilterCriteria({...filterCriteria, year: e.target.value})}
                    />
                </div>
            </div>

            <button className="reset-filters-btn" onClick={resetFilters}>
                <CloseIcon style={{ width: '16px', height: '16px', marginRight: '4px', verticalAlign: 'text-bottom' }} fill="currentColor" />
                Reset Filters
            </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '24px', border: '1px solid #fee2e2' }}>
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
                <th>Image</th>
                <th>Car Details</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredCars.map(car => (
                <tr key={car._id}>
                    <td>
                    {car.primaryImage ? (
                        <img 
                            src={`http://localhost:5000/${car.primaryImage}`} 
                            alt="Car" 
                            style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} 
                        />
                    ) : (
                        <div style={{ width: '60px', height: '40px', background: '#f3f4f6', borderRadius: '6px' }}></div>
                    )}
                    </td>
                    <td>
                    <div style={{ fontWeight: '600', color: '#111827' }}>{car.brand} {car.model}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{car.year} • {car.fuelType} • {car.kilometers} km</div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#374151' }}>₹{car.price.toLocaleString()}</td>
                    <td>
                    <span className={`status-badge status-${car.status}`}>
                        {car.status}
                    </span>
                    </td>
                    <td>
                    <div className="action-buttons-cell">
                        <button className="action-btn btn-view" onClick={() => openDetailModal(car)} title="View Details">
                            View
                        </button>
                        {car.status !== 'sold' && (
                            <>
                                {car.status !== 'booked' && (
                                    <button className="action-btn btn-edit" onClick={() => updateStatus(car._id, 'booked')} title="Mark as Booked">
                                         Book
                                    </button>
                                )}
                                {car.status !== 'available' && (
                                    <button className="action-btn btn-view" onClick={() => updateStatus(car._id, 'available')} title="Mark as Available">
                                         Avail
                                    </button>
                                )}
                            </>
                        )}
                        <button className="action-btn btn-delete" onClick={() => { setSelectedCar(car); setSoldFormData({...soldFormData, salePrice: car.price}); setIsSoldModalOpen(true); }} title="Mark as Sold">
                             Sold
                        </button>
                        <button className="action-btn btn-delete" onClick={() => deleteCar(car._id)} title="Delete Car">
                            <DeleteIcon className="btn-icon-svg" fill="currentColor" />
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
                {filteredCars.length === 0 && (
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            No cars found matching your filters.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      )}

      {/* Detail Modal */}
      {isModalOpen && selectedCar && (
        <div className="modal-overlay" onClick={closeDetailModal}>
            <div className="modal-content-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Vehicle Details</h2>
                    <button className="modal-close-btn" onClick={closeDetailModal}>
                        <CloseIcon fill="currentColor" />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="detail-section">
                        <h3>Vehicle Images</h3>
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
                            {selectedCar.images && selectedCar.images.length > 0 ? (
                                selectedCar.images.map((img, index) => (
                                    <img 
                                        key={index} 
                                        src={`http://localhost:5000/${img}`} 
                                        alt={`Car view ${index + 1}`} 
                                        style={{ height: '150px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                                    />
                                ))
                            ) : (
                                <p className="text-muted">No images available</p>
                            )}
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Vehicle Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Brand</span>
                                <span className="detail-value">{selectedCar.brand}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Model</span>
                                <span className="detail-value">{selectedCar.model}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Year</span>
                                <span className="detail-value">{selectedCar.year}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Fuel Type</span>
                                <span className="detail-value">{selectedCar.fuelType}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Color</span>
                                <span className="detail-value">{selectedCar.color}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Price</span>
                                <span className="detail-value">₹{selectedCar.price.toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Kilometers</span>
                                <span className="detail-value">{selectedCar.kilometers} km</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Owners</span>
                                <span className="detail-value">{selectedCar.owners}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Location</span>
                                <span className="detail-value">{selectedCar.location}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Transmission</span>
                                <span className="detail-value">{selectedCar.transmissionType || 'Manual'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Body Type</span>
                                <span className="detail-value">{selectedCar.bodyType || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Registration (RTO)</span>
                                <span className="detail-value">{selectedCar.registrationRTO || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Seating Capacity</span>
                                <span className="detail-value">{selectedCar.seatingCapacity || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Insurance</span>
                                <span className="detail-value">{selectedCar.insuranceInfo || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Service History</span>
                                <span className="detail-value">{selectedCar.serviceHistory || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Condition</span>
                                <span className="detail-value">{selectedCar.condition || 'N/A'}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Status</span>
                                <div>
                                    <span className={`status-badge status-${selectedCar.status}`}>
                                        {selectedCar.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Description</h3>
                        <div className="detail-message">
                            {typeof selectedCar.description === 'string' 
                                ? selectedCar.description 
                                : selectedCar.description?.en || 'No description available.'}
                        </div>
                    </div>
                </div>
                <div className="modal-footer" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-secondary" onClick={closeDetailModal}>
                        Close
                    </button>
                    {selectedCar.status !== 'sold' && (
                        <button className="action-btn btn-delete" onClick={() => { setSoldFormData({...soldFormData, salePrice: selectedCar.price}); setIsSoldModalOpen(true); closeDetailModal(); }}>
                            Mark as Sold
                        </button>
                    )}
                    <button className="action-btn btn-delete" onClick={() => { deleteCar(selectedCar._id); closeDetailModal(); }}>
                        Delete Vehicle
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Sold Car Modal */}
      {isSoldModalOpen && selectedCar && (
        <div className="modal-overlay" onClick={() => setIsSoldModalOpen(false)}>
            <div className="modal-content-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Record Sale: {selectedCar.brand} {selectedCar.model}</h2>
                    <button className="modal-close-btn" onClick={() => setIsSoldModalOpen(false)}>
                        <CloseIcon fill="currentColor" />
                    </button>
                </div>
                <form onSubmit={handleSoldSubmit}>
                    <div className="modal-body">
                        <div className="detail-section">
                            <h3>Buyer Information</h3>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Buyer Name</label>
                                    <input type="text" name="buyerName" className="form-input" value={soldFormData.buyerName} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" name="buyerEmail" className="form-input" value={soldFormData.buyerEmail} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input type="tel" name="buyerPhone" className="form-input" value={soldFormData.buyerPhone} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <input type="text" name="buyerAddress" className="form-input" value={soldFormData.buyerAddress} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">District</label>
                                    <input type="text" name="buyerDistrict" className="form-input" value={soldFormData.buyerDistrict} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">State</label>
                                    <input type="text" name="buyerState" className="form-input" value={soldFormData.buyerState} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input type="text" name="buyerCountry" className="form-input" value={soldFormData.buyerCountry} onChange={handleSoldInputChange} required />
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h3>Purchase Information</h3>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Sale Price (₹)</label>
                                    <input type="number" name="salePrice" className="form-input" value={soldFormData.salePrice} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sale Date</label>
                                    <input type="date" name="saleDate" className="form-input" value={soldFormData.saleDate} onChange={handleSoldInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment Method</label>
                                    <select name="paymentMethod" className="form-input" value={soldFormData.paymentMethod} onChange={handleSoldInputChange} required>
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Finance/Loan">Finance/Loan</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Additional Notes</label>
                                    <textarea name="additionalNotes" className="form-textarea" value={soldFormData.additionalNotes} onChange={handleSoldInputChange} style={{ minHeight: '80px' }}></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="btn-secondary" onClick={() => setIsSoldModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '600' }}>
                            Confirm Sale
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default CarManagement;
