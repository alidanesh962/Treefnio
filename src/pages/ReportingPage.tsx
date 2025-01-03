// src/pages/ReportingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, FileText, ChevronLeft, BarChart2, Package, DollarSign, PieChart } from 'lucide-react';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import BackButton from '../components/layout/BackButton';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import MaterialsReportSection from '../components/reports/MaterialsReportSection';
import BostonGraphSection from '../components/reports/BostonGraphSection';
import SalesReportView from '../components/sales/SalesReportView';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { CurrentUser } from '../types';
import { SalesService } from '../services/salesService';
import { ShamsiDate } from '../utils/shamsiDate';
import { SaleBatch } from '../types/sales';

export default function ReportingPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('sales-report');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [report, setReport] = useState({
    byDepartment: {},
    byProductionSegment: {},
    overall: {
      totalUnits: 0,
      totalRevenue: 0,
      totalCost: 0,
      netRevenue: 0,
    },
    timeRange: {
      start: ShamsiDate.getCurrentShamsiDate(),
      end: ShamsiDate.getCurrentShamsiDate(),
    },
  });
  const [salesData, setSalesData] = useState<SaleBatch[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    loadSalesData();
  }, [navigate]);

  const loadSalesData = async () => {
    try {
      const data = await SalesService.getSalesHistory();
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const handleBatchSelect = async (batchIds: string[]) => {
    setSelectedBatches(batchIds);
    try {
      const newReport = await SalesService.getSalesReportForBatches(batchIds);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading sales report for batches:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    clearCurrentUser();
    setShowLogoutDialog(false);
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleDateRangeChange = async (startDate: string, endDate: string) => {
    try {
      const newReport = await SalesService.getSalesReport(startDate, endDate);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading sales report:', error);
      // TODO: Show error notification
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 transform ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-64'
        } bg-white dark:bg-gray-800 w-64 transition-transform duration-200 ease-in-out
        border-l border-gray-200 dark:border-gray-700 z-30`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">گزارش‌ها</h2>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        
        <nav className="mt-4">
          <button
            onClick={() => setActiveMenu('sales-report')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'sales-report' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <DollarSign className="h-5 w-5" />
            گزارش فروش
          </button>

          <button
            onClick={() => setActiveMenu('materials-report')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'materials-report' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Package className="h-5 w-5" />
            گزارش مواد اولیه
          </button>

          <button
            onClick={() => setActiveMenu('boston-report')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'boston-report' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <PieChart className="h-5 w-5" />
            ماتریس بوستون
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${isSidebarOpen ? 'mr-64' : 'mr-0'} transition-all duration-200`}>
        {/* Top Navigation Bar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300">
                  {currentUser.username}
                </span>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg
                           bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  خروج
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              {activeMenu === 'sales-report' && 'گزارش فروش'}
              {activeMenu === 'materials-report' && 'گزارش مواد اولیه'}
              {activeMenu === 'boston-report' && 'ماتریس بوستون'}
            </h1>
            
            {activeMenu === 'sales-report' && (
              <SalesReportView
                report={report}
                salesBatches={salesData}
                onDateRangeChange={handleDateRangeChange}
                onBatchSelect={handleBatchSelect}
              />
            )}
            {activeMenu === 'materials-report' && <MaterialsReportSection />}
            {activeMenu === 'boston-report' && (
              <BostonGraphSection 
                report={report}
                salesBatches={salesData}
                onDateRangeChange={handleDateRangeChange}
              />
            )}
          </div>
        </main>
      </div>

      {/* Fixed Position Elements */}
      <DarkModeToggle />
      <BackButton />

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        username={currentUser.username}
      />
    </div>
  );
}