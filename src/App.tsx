// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import InventoryManagement from './pages/InventoryManagement';
import ReportingPage from './pages/ReportingPage'; // New import

function App() {
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/reports" element={<ReportingPage />} /> {/* New route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;