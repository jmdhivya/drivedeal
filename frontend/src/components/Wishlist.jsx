import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { WishlistFillIcon, DeleteIcon, AvailableIcon, SoldIcon, BookedIcon } from './Icons';
import './Cars.css';
import './Wishlist.css';

const Wishlist = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        fetchWishlist();
    }, [isAuthenticated, user]);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/wishlist/${user._id}`);
            const data = await response.json();
            if (data.success) {
                setWishlistItems(data.data);
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (carId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/wishlist/${user._id}/${carId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setWishlistItems(prev => prev.filter(item => (item.carId._id || item.carId) !== carId));
            }
        } catch (err) {
            console.error('Error removing from wishlist:', err);
        }
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/400x250?text=No+Image';
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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available': return <AvailableIcon className="status-icon" fill="#10b981" />;
            case 'sold': return <SoldIcon className="status-icon" fill="#ef4444" />;
            case 'booked': return <BookedIcon className="status-icon" fill="#f59e0b" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="wishlist-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading your wishlist...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="wishlist-container">
                <div className="wishlist-header">
                    <h1>My Wishlist</h1>
                    <p>{wishlistItems.length} {wishlistItems.length === 1 ? 'car' : 'cars'} saved</p>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="empty-wishlist">
                        <WishlistFillIcon className="empty-icon" fill="var(--border-color)" />
                        <h2>Your wishlist is empty</h2>
                        <p>Explore our collection and save cars you're interested in.</p>
                        <button className="btn-primary" onClick={() => navigate('/cars')}>Browse Cars</button>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlistItems.map((item) => {
                            const car = item.carId;
                            if (!car) return null;
                            return (
                                <div key={item._id} className="wishlist-card">
                                    <div className="card-image-wrapper" onClick={() => navigate(`/cars/${car._id}`)}>
                                        <img src={getImageUrl(car.primaryImage)} alt={`${car.brand} ${car.model}`} />
                                        <div className={`status-tag ${car.status}`}>
                                            {getStatusIcon(car.status)}
                                            <span>{car.status.toUpperCase()}</span>
                                        </div>
                                    </div>
                                    <div className="card-content">
                                        <div className="card-header">
                                            <div>
                                                <h3 className="car-brand">{car.brand}</h3>
                                                <h4 className="car-model">{car.model}</h4>
                                            </div>
                                            <button 
                                                className="remove-btn" 
                                                onClick={() => removeFromWishlist(car._id)}
                                                title="Remove from wishlist"
                                            >
                                                <DeleteIcon className="delete-icon" fill="#ef4444" />
                                            </button>
                                        </div>
                                        <div className="card-specs">
                                            <span>{car.year}</span>
                                            <span className="dot">•</span>
                                            <span>{car.fuelType}</span>
                                            <span className="dot">•</span>
                                            <span>{car.kilometers?.toLocaleString()} km</span>
                                        </div>
                                        <div className="card-footer">
                                            <div className="car-price">{formatPrice(car.price)}</div>
                                            <button className="view-details-btn" onClick={() => navigate(`/cars/${car._id}`)}>
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wishlist;