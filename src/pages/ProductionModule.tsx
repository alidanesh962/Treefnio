// src/pages/ProductionModule.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, List, Plus, Edit3
} from 'lucide-react';
import DarkModeToggle from '../components/layout/DarkModeToggle';
import BackButton from '../components/layout/BackButton';
import LogoutConfirmDialog from '../components/common/LogoutConfirmDialog';
import ProductDefinitionForm from '../components/production/ProductDefinitionForm';
import ProductsList from '../components/production/ProductsList';
import EditingProducts from '../components/production/EditingProducts';
import RecipeDefinitionForm from '../components/production/RecipeDefinitionForm';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';
import { db } from '../database';
import { CurrentUser, ProductDefinition } from '../types';

export default function ProductionModule() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(getCurrentUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState('products-list');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDefinition | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
  }, [currentUser, navigate]);

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

  const handleProductSelected = (product: ProductDefinition) => {
    console.log('Product selected:', product);
    setSelectedProduct(product);
    setActiveMenu('recipe-definition');
  };

  const getMenuContent = () => {
    switch (activeMenu) {
      case 'product-definition':
        return (
          <ProductDefinitionForm 
            onBack={() => setActiveMenu('products-list')}
            onSuccess={() => {
              setRefreshTrigger(prev => prev + 1);
              setActiveMenu('products-list');
            }}
          />
        );
      case 'products-list':
        return (
          <ProductsList 
            onProductSelect={handleProductSelected}
            key={refreshTrigger}
          />
        );
      case 'recipe-definition':
        return selectedProduct ? (
          <RecipeDefinitionForm 
            product={selectedProduct}
            onBack={() => {
              setSelectedProduct(null);
              setActiveMenu('products-list');
            }}
          />
        ) : null;
      case 'edit-products':
        return <EditingProducts />;
      default:
        return null;
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
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">ماژول تولید</h2>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="mt-4">
          <div className="flex items-center mb-2 px-4">
            <Menu className="h-5 w-5 text-gray-400" />
            <span className="mr-2 text-sm text-gray-400">منو</span>
          </div>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setActiveMenu('products-list');
            }}
            className={`flex items-center w-full px-4 py-2 text-sm text-right gap-2
                      ${activeMenu === 'products-list' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <List className="h-4 w-4" />
            لیست محصولات
          </button>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setActiveMenu('product-definition');
            }}
            className={`flex items-center w-full px-4 py-2 text-sm text-right gap-2
                      ${activeMenu === 'product-definition' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Plus className="h-4 w-4" />
            تعریف محصول جدید
          </button>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setActiveMenu('edit-products');
            }}
            className={`flex items-center w-full px-4 py-2 text-sm text-right gap-2
                      ${activeMenu === 'edit-products' 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <Edit3 className="h-4 w-4" />
            ویرایش محصولات
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