import React, { useState } from 'react';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

export default function App() {
  // ==========================================
  // ROUTING STATE MANAGEMENT
  // ==========================================
  const [currentPage, setCurrentPage] = useState('landing');
  const [token, setToken] = useState(localStorage.getItem('api_token') || '');

  // Handler untuk navigasi ke login
  const handleGoToLogin = () => {
    setCurrentPage('login');
  };

  // Handler untuk kembali ke landing
  const handleGoBack = () => {
    setCurrentPage('landing');
  };

  // Handler untuk login sukses
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setCurrentPage('dashboard');
  };

  // Handler untuk logout
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('api_token');
    setCurrentPage('landing');
  };



  // ==========================================
  // RENDER BERDASARKAN CURRENT PAGE
  // ==========================================
  if (currentPage === 'landing') {
    return <LandingPage onGoToLogin={handleGoToLogin} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onGoBack={handleGoBack} />;
  }

  if (currentPage === 'dashboard' && token) {
    return <Dashboard token={token} onLogout={handleLogout} />;
  }

  // Fallback (seharusnya tidak terjadi)
  return <LandingPage onGoToLogin={handleGoToLogin} />;
}