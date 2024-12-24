// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import InventoryManagement from './pages/InventoryManagement';
import ReportingPage from './pages/ReportingPage';
import SalesModule from './pages/SalesModule';
import ProductionModule from './pages/ProductionModule';
import { SocketProvider } from './utils/socketContext';

function App() {
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/reports" element={<ReportingPage />} />
          <Route path="/sales" element={<SalesModule />} />
          <Route path="/production" element={<ProductionModule />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;