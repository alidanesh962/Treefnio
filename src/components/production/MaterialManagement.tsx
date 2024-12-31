// src/components/production/MaterialManagement.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Item, MaterialUnit, Department } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';
import { useFirebaseSync } from '../../hooks/useFirebaseSync';
import { COLLECTIONS } from '../../services/firebaseService';
import { useFirebase } from '../../contexts/FirebaseContext';

interface MaterialFormData {
  name: string;
  code: string;
  department: string;
  price: number;
}

export default function MaterialManagement() {
  const { data: materials, loading, error, addItem, updateItem, deleteItem } = useFirebaseSync<Item>(COLLECTIONS.MATERIALS);
  const { data: departments } = useFirebaseSync<Department>(COLLECTIONS.DEPARTMENTS);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Item | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    code: '',
    department: '',
    price: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    materialId: string;
    materialName: string;
  }>({ isOpen: false, materialId: '', materialName: '' });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      price: 0
    });
    setErrors({});
    setEditingMaterial(null);
    setShowForm(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام ماده اولیه الزامی است';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'کد ماده اولیه الزامی است';
    }
    if (!formData.department) {
      newErrors.department = 'انتخاب گروه الزامی است';
    }
    if (formData.price <= 0) {
      newErrors.price = 'قیمت باید بزرگتر از صفر باشد';
    }

    // Check for duplicates
    const isDuplicate = materials.some(m => 
      (m.code === formData.code || m.name === formData.name) && m.id !== editingMaterial?.id
    );
    if (isDuplicate) {
      newErrors.code = 'این کد یا نام قبلاً ثبت شده است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const materialData = {
      ...formData,
      type: 'material' as const,
      id: editingMaterial?.id || `material-${Date.now()}`,
      createdAt: editingMaterial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingMaterial) {
        await updateItem(materialData.id, materialData);
        const user = getCurrentUser();
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'edit',
            'materials',
            `Updated material "${materialData.name}"`
          );
        }
      } else {
        await addItem(materialData);
        const user = getCurrentUser();
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'create',
            'materials',
            `Created new material "${materialData.name}"`
          );
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
      setErrors({ submit: 'Error saving material. Please try again.' });
    }
  };

  const handleEdit = (material: Item) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      code: material.code,
      department: material.department,
      price: material.price
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm.materialId) {
      try {
        const material = materials.find(m => m.id === showDeleteConfirm.materialId);
        await deleteItem(showDeleteConfirm.materialId);
        const user = getCurrentUser();
        if (user && material) {
          logUserActivity(
            user.username,
            user.username,
            'delete',
            'materials',
            `Deleted material "${material.name}"`
          );
        }
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
    setShowDeleteConfirm({ isOpen: false, materialId: '', materialName: '' });
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading materials: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          مدیریت مواد اولیه
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن ماده اولیه جدید
        </button>
      </div>

      {/* Material Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام ماده اولیه
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
                کد ماده اولیه
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                گروه
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.department 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">انتخاب گروه...</option>
                {departments?.map(dept => (
                  <option key={dept.name} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-500">{errors.department}</p>
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
              {editingMaterial ? 'ویرایش' : 'افزودن'}
            </button>
          </div>
        </div>
      )}

      {/* Materials List */}
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
                گروه
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
            {materials.map((material) => (
              <tr key={material.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {material.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(material)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 
                               dark:hover:text-blue-300 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({
                        isOpen: true,
                        materialId: material.id,
                        materialName: material.name
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
        title="حذف ماده اولیه"
        message={`آیا از حذف "${showDeleteConfirm.materialName}" اطمینان دارید؟`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, materialId: '', materialName: '' })}
      />
    </div>
  );
}