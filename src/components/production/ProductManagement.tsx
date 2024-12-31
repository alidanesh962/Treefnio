import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Product } from '../../types';
import { Department } from '../../types/department';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';
import { useFirebaseSync } from '../../hooks/useFirebaseSync';
import { COLLECTIONS } from '../../services/firebaseService';

interface ProductFormData {
  name: string;
  code: string;
  description: string;
  price: number;
  category: string;
}

export default function ProductManagement() {
  const { data: products, loading, error, addItem, updateItem, deleteItem } = useFirebaseSync<Product>(COLLECTIONS.PRODUCTS);
  const { data: departments } = useFirebaseSync<Department>(COLLECTIONS.DEPARTMENTS);
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    code: '',
    description: '',
    price: 0,
    category: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({ isOpen: false, productId: '', productName: '' });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      price: 0,
      category: ''
    });
    setErrors({});
    setEditingProduct(null);
    setShowForm(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام محصول الزامی است';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'کد محصول الزامی است';
    }
    if (!formData.category) {
      newErrors.category = 'انتخاب دسته‌بندی الزامی است';
    }
    if (formData.price <= 0) {
      newErrors.price = 'قیمت باید بزرگتر از صفر باشد';
    }

    // Check for duplicates
    const isDuplicate = products.some(p => 
      (p.code === formData.code || p.name === formData.name) && p.id !== editingProduct?.id
    );
    if (isDuplicate) {
      newErrors.code = 'این کد یا نام قبلاً ثبت شده است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const newProduct: Product = {
      ...formData,
      id: editingProduct?.id || `product-${Date.now()}`,
      type: 'product' as const,
      createdAt: editingProduct?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isActive: true
    };

    try {
      if (editingProduct) {
        await updateItem(newProduct.id, newProduct);
        const user = getCurrentUser();
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'edit',
            'products',
            `Updated product "${newProduct.name}"`
          );
        }
      } else {
        await addItem(newProduct);
        const user = getCurrentUser();
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'create',
            'products',
            `Created new product "${newProduct.name}"`
          );
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ submit: 'Error saving product. Please try again.' });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description || '',
      price: product.price,
      category: product.category
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm.productId) {
      try {
        const product = products.find(p => p.id === showDeleteConfirm.productId);
        await deleteItem(showDeleteConfirm.productId);
        const user = getCurrentUser();
        if (user && product) {
          logUserActivity(
            user.username,
            user.username,
            'delete',
            'products',
            `Deleted product "${product.name}"`
          );
        }
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
    setShowDeleteConfirm({ isOpen: false, productId: '', productName: '' });
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading products: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          مدیریت محصولات
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن محصول جدید
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام محصول
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد محصول
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.code 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                دسته‌بندی
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.category 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">انتخاب دسته‌بندی...</option>
                {departments?.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                قیمت
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.price 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 transition-colors"
            >
              {editingProduct ? 'ویرایش' : 'افزودن'}
            </button>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                نام
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                کد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                دسته‌بندی
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                قیمت
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 
                               dark:hover:text-blue-300 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({
                        isOpen: true,
                        productId: product.id,
                        productName: product.name
                      })}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 
                               dark:hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        title="حذف محصول"
        message={`آیا از حذف "${showDeleteConfirm.productName}" اطمینان دارید؟`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, productId: '', productName: '' })}
      />
    </div>
  );
} 