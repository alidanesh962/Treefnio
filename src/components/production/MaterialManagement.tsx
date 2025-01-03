// src/components/production/MaterialManagement.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { db } from '../../database';
import { Item, MaterialUnit } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';

interface MaterialFormData {
  name: string;
  code: string;
  department: string;
  price: number;
  unit: string;
}

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Item[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Item | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    code: '',
    department: '',
    price: 0,
    unit: ''
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    materialId: string;
    materialName: string;
  }>({ isOpen: false, materialId: '', materialName: '' });
  const [autoGenerateCode, setAutoGenerateCode] = useState(false);

  const { emitUpdate } = useRealTimeUpdates('material-update', (data) => {
    switch (data.type) {
      case 'add':
        setMaterials(prev => [...prev, data.material]);
        break;
      case 'update':
        setMaterials(prev => prev.map(material => 
          material.id === data.material.id ? data.material : material
        ));
        break;
      case 'delete':
        setMaterials(prev => prev.filter(material => material.id !== data.materialId));
        break;
    }
  });

  useEffect(() => {
    loadMaterials();
    loadDepartments();
    loadUnits();
  }, []);

  const loadUnits = () => {
    const loadedUnits = db.getMaterialUnits();
    setUnits(loadedUnits);
    if (!formData.unit && loadedUnits.length > 0) {
      setFormData(prev => ({ ...prev, unit: loadedUnits[0].id }));
    }
  };

  const loadMaterials = () => {
    setMaterials(db.getMaterials());
  };

  const loadDepartments = () => {
    const savedGroups = localStorage.getItem('material_food_groups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      setDepartments(groups.map((group: { name: string }) => group.name));
    } else {
      setDepartments([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      price: 0,
      unit: units[0]?.id || ''
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
    if (!autoGenerateCode && !formData.code.trim()) {
      newErrors.code = 'کد ماده اولیه الزامی است';
    }
    if (!formData.department) {
      newErrors.department = 'انتخاب گروه الزامی است';
    }
    if (!formData.unit) {
      newErrors.unit = 'انتخاب واحد الزامی است';
    }
    if (formData.price <= 0) {
      newErrors.price = 'قیمت باید بزرگتر از صفر باشد';
    }

    // Check for duplicates
    if (db.isMaterialDuplicate(formData.code, formData.name, editingMaterial?.id)) {
      newErrors.code = 'این کد یا نام قبلاً ثبت شده است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const materialData: Omit<Item, 'id'> = {
      name: formData.name.trim(),
      code: autoGenerateCode ? `MAT${Date.now().toString().slice(-6)}` : formData.code.trim(),
      department: formData.department,
      price: formData.price,
      unit: formData.unit || units[0]?.id || '',
      type: 'material'
    };

    if (editingMaterial) {
      db.updateMaterial({ ...editingMaterial, ...materialData } as Item);
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
      db.addMaterial(materialData);
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

    loadMaterials();
    resetForm();
  };

  const handleEdit = (material: Item) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      code: material.code,
      department: material.department,
      price: material.price,
      unit: material.unit || units[0]?.id || ''
    });
    setShowForm(true);
  };

  const handleDelete = () => {
    if (showDeleteConfirm.materialId) {
      const material = materials.find(m => m.id === showDeleteConfirm.materialId);
      db.deleteMaterial(showDeleteConfirm.materialId);
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
      loadMaterials();
    }
    setShowDeleteConfirm({ isOpen: false, materialId: '', materialName: '' });
  };

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
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  disabled={autoGenerateCode}
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    errors.code 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${
                    autoGenerateCode ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoGenerateCode"
                    checked={autoGenerateCode}
                    onChange={(e) => {
                      setAutoGenerateCode(e.target.checked);
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, code: '' }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="autoGenerateCode" className="text-sm text-gray-600 dark:text-gray-400">
                    تولید خودکار
                  </label>
                </div>
              </div>
              {errors.code && (
                <p className="mt-1 text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                واحد
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.unit 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">انتخاب واحد...</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
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
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-500">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                قیمت (ریال)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.price 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                min="0"
                step="1000"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                       rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              {editingMaterial ? 'بروزرسانی' : 'ذخیره'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 
                       rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نام
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                کد
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                گروه
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                واحد
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                قیمت (ریال)
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {materials.map(material => {
              const materialUnit = units.find(u => u.id === material.unit);
              return (
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
                    {materialUnit ? `${materialUnit.name} (${materialUnit.symbol})` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {material.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(material)}
                        className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({
                          isOpen: true,
                          materialId: material.id,
                          materialName: material.name
                        })}
                        className="p-1 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        itemName={showDeleteConfirm.materialName}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, materialId: '', materialName: '' })}
        type="item"
      />
    </div>
  );
}