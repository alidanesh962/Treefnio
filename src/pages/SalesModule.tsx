// src/pages/SalesModule.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, List, FileText, Upload, BarChart
} from 'lucide-react';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import BackButton from '../components/layout/BackButton';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { db } from '../database';
import { CurrentUser } from '../types/auth';
import { ExtendedProductDefinition } from '../types';
import { ShamsiDate } from '../utils/shamsiDate';
import ManualSalesEntry from '../components/sales/ManualSalesEntry';
import SalesHistory from '../components/sales/SalesHistory';
import SalesImport from '../components/sales/SalesImport';
import SalesReportView from '../components/sales/SalesReportView';
import { SaleBatch, SalesReport } from '../types/sales';
import { SalesService } from '../services/salesService';

export default function SalesModule() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getCurrentUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('manual-entry');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [salesData, setSalesData] = useState<SaleBatch[]>([]);
  const [products, setProducts] = useState<ExtendedProductDefinition[]>([]);
  const [report, setReport] = useState<SalesReport>({
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
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Initialize default departments if none exist
    const saleDepts = db.getDepartmentsByType('sale');
    const prodDepts = db.getDepartmentsByType('production');
    
    if (saleDepts.length === 0) {
      console.log('Initializing default sale department');
      db.addDepartment('فروش عمومی', 'sale');
    }
    
    if (prodDepts.length === 0) {
      console.log('Initializing default production department');
      db.addDepartment('تولید عمومی', 'production');
    }

    // Initialize a default product if none exist
    const existingProducts = db.getProductDefinitions();
    if (existingProducts.length === 0) {
      console.log('Initializing default product');
      const saleDept = db.getDepartmentsByType('sale')[0];
      const prodDept = db.getDepartmentsByType('production')[0];
      
      if (saleDept && prodDept) {
        db.addProductDefinition({
          name: 'محصول نمونه',
          code: '001',
          saleDepartment: saleDept.id,
          productionSegment: prodDept.id,
          autoGenerateCode: false
        });
      }
    }

    loadSalesData();
    loadProducts();
  }, [currentUser, navigate]);

  const loadSalesData = async () => {
    try {
      const data = db.getSalesHistory();
      setSalesData(data);
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const loadProducts = () => {
    try {
      console.log('Loading products...');
      const definedProducts = db.getProductDefinitions();
      const inventoryProducts = db.getProducts();
      
      const allProducts = [...definedProducts].map(product => ({
        ...product,
        isActive: db.isProductActive(product.id)
      }));
      
      // Add products from inventory if they don't exist in definitions
      inventoryProducts.forEach(invProduct => {
        if (!definedProducts.some(defProduct => defProduct.code === invProduct.code)) {
          allProducts.push({
            id: invProduct.id,
            name: invProduct.name,
            code: invProduct.code,
            saleDepartment: invProduct.department,
            productionSegment: invProduct.department,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true
          });
        }
      });

      console.log('Loaded products:', allProducts);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleSalesEntry = async (entries: any[]) => {
    try {
      console.log('Handling sales entry:', entries);
      await db.importSalesData(entries, products);
      await loadSalesData();
    } catch (error) {
      console.error('Error saving sales data:', error);
    }
  };

  const handleDateRangeChange = async (startDate: string, endDate: string) => {
    try {
      const newReport = await db.getSalesReport(startDate, endDate);
      setReport(newReport);
    } catch (error) {
      console.error('Error loading sales report:', error);
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

  const getMenuContent = () => {
    switch (activeMenu) {
      case 'manual-entry':
        console.log('Rendering ManualSalesEntry with products:', products);
        return <ManualSalesEntry onSave={handleSalesEntry} products={products} />;
      case 'sales-history':
        return <SalesHistory salesData={salesData} />;
      case 'sales-import':
        return <SalesImport onImport={handleSalesEntry} products={products} />;
      case 'sales-report':
        return <SalesReportView 
          report={report} 
          salesBatches={salesData}
          onDateRangeChange={handleDateRangeChange}
          onBatchSelect={handleBatchSelect}
        />;
      default:
        return null;
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">ماژول فروش</h2>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="mt-4">
          <button
            onClick={() => setActiveMenu('manual-entry')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'manual-entry' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <List className="h-4 w-4" />
            ثبت فروش
          </button>

          <button
            onClick={() => setActiveMenu('sales-history')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'sales-history' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <FileText className="h-4 w-4" />
            تاریخچه فروش
          </button>

          <button
            onClick={() => setActiveMenu('sales-import')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'sales-import' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Upload className="h-4 w-4" />
            ورود اطلاعات از فایل
          </button>

          <button
            onClick={() => setActiveMenu('sales-report')}
            className={`flex items-center w-full px-4 py-2 text-right gap-2
                      ${activeMenu === 'sales-report' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <BarChart className="h-4 w-4" />
            گزارش فروش
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
                  <LogOut className="h-4 w-4" />
                  خروج
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="p-8">
          {getMenuContent()}
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