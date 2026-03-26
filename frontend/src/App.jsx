import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Cars from './components/Cars';
import CarDetails from './components/CarDetails';
import EnquiryPage from './components/EnquiryPage';
import AdminPanel from './components/AdminPanel';
import Profile from './components/Profile';
import Wishlist from './components/Wishlist';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {!isAdminPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/cars/:id" element={<CarDetails />} />
        <Route path="/enquiry" element={<EnquiryPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

function App() {
  const basename = (import.meta.env.BASE_URL || '/DRIVEDEAL').replace(/\/$/, '');

  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router basename={basename}>
            <AppContent />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

