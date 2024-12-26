import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { db } from '../../database';
import { Department } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';

interface DepartmentFormData {
  name: string;
  type: 'sale' | 'production';
}

interface FormErrors {
  name?: string;
  similar?: string;
  general?: string;
}

export default function DepartmentsManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    type: 'production'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    departmentId: string;
    departmentName: string;
  }>({ isOpen: false, departmentId: '', departmentName: '' });
  const [activeFilter, setActiveFilter] = useState<'all' | 'sale' | 'production'>('all');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    const loadedDepartments = db.getDepartments();
    // Sort departments by type first, then alphabetically by name
    const sortedDepartments = [...loadedDepartments].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'sale' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'fa');
    });
    setDepartments(sortedDepartments);
  };
  const resetForm = () => {
    setFormData({ name: '', type: 'production' });
    setErrors({});
    setEditingDepartment(null);
    setShowForm(false);
  };

  const normalizeText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/‌/g, '') // Remove ZWNJ
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک');
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Trim and normalize the input
    const normalizedName = normalizeText(formData.name);

    if (!normalizedName) {
      newErrors.name = 'نام بخش الزامی است';
      setErrors(newErrors);
      return false;
    }

    // Check for similar names within the same type
    const similarDepartments = departments.filter(dept => {
      if (dept.id === editingDepartment?.id) return false;
      if (dept.type !== formData.type) return false;

      const existingNormalizedName = normalizeText(dept.name);
      return (
        existingNormalizedName === normalizedName ||
        existingNormalizedName.includes(normalizedName) ||
        normalizedName.includes(existingNormalizedName)
      );
    });

    if (similarDepartments.length > 0) {
      newErrors.name = 'این نام بخش قبلاً ثبت شده است';
      newErrors.similar = `بخش‌های مشابه: ${similarDepartments.map(d => d.name).join('، ')}`;
    }

    // Prevent having empty departments list for each type
    if (!editingDepartment) {
      const departmentsOfType = departments.filter(d => d.type === formData.type);
      if (departmentsOfType.length === 0) {
        newErrors.general = `باید حداقل یک بخش ${formData.type === 'sale' ? 'فروش' : 'تولید'} وجود داشته باشد`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = () => {
    if (!validate()) return;

    const trimmedName = formData.name.trim();
    const user = getCurrentUser();

    if (editingDepartment) {
      // Check if this is the last department of its type before allowing type change
      if (editingDepartment.type !== formData.type) {
        const remainingOfType = departments.filter(d => 
          d.type === editingDepartment.type && d.id !== editingDepartment.id
        ).length;

        if (remainingOfType === 0) {
          setErrors({
            general: `نمی‌توان نوع آخرین بخش ${editingDepartment.type === 'sale' ? 'فروش' : 'تولید'} را تغییر داد`
          });
          return;
        }
      }

      db.updateDepartment({
        ...editingDepartment,
        name: trimmedName,
        type: formData.type
      });
      
      if (user) {
        logUserActivity(
          user.username,
          user.username,
          'edit',
          'departments',
          `Updated department "${trimmedName}"`
        );
      }
    } else {
      db.addDepartment(trimmedName, formData.type);
      if (user) {
        logUserActivity(
          user.username,
          user.username,
          'create',
          'departments',
          `Created new department "${trimmedName}"`
        );
      }
    }

    loadDepartments();
    resetForm();
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      type: department.type
    });
    setShowForm(true);
  };

  const handleDelete = () => {
    if (showDeleteConfirm.departmentId) {
      const departmentToDelete = departments.find(d => d.id === showDeleteConfirm.departmentId);
      if (!departmentToDelete) return;

      // Check if this is the last department of its type
      const remainingOfType = departments.filter(d => 
        d.type === departmentToDelete.type && d.id !== departmentToDelete.id
      ).length;

      if (remainingOfType === 0) {
        alert(`نمی‌توان آخرین بخش ${departmentToDelete.type === 'sale' ? 'فروش' : 'تولید'} را حذف کرد`);
        setShowDeleteConfirm({ isOpen: false, departmentId: '', departmentName: '' });
        return;
      }

      // Check if department is in use
      // You might want to add a method in db to check this
      /*
      if (db.isDepartmentInUse(showDeleteConfirm.departmentId)) {
        alert('این بخش در حال استفاده است و نمی‌توان آن را حذف کرد');
        setShowDeleteConfirm({ isOpen: false, departmentId: '', departmentName: '' });
        return;
      }
      */

      db.deleteDepartment(showDeleteConfirm.departmentId);
      const user = getCurrentUser();
      if (user) {
        logUserActivity(
          user.username,
          user.username,
          'delete',
          'departments',
          `Deleted department "${departmentToDelete.name}"`
        );
      }
      loadDepartments();
    }
    setShowDeleteConfirm({ isOpen: false, departmentId: '', departmentName: '' });
  };

  const filteredDepartments = departments.filter(dept => 
    activeFilter === 'all' ? true : dept.type === activeFilter
  );

  const getDepartmentCounts = () => {
    const sales = departments.filter(d => d.type === 'sale').length;
    const production = departments.filter(d => d.type === 'production').length;
    return { sales, production };
  };

  const counts = getDepartmentCounts();
  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            بخش‌ها و گروه‌ها
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {`${counts.sales} بخش فروش و ${counts.production} بخش تولید`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن بخش جدید
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'همه' },
          { id: 'sale', label: 'بخش‌های فروش' },
          { id: 'production', label: 'بخش‌های تولید' }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as 'all' | 'sale' | 'production')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeFilter === filter.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {filter.label}
            <span className="mr-2 text-xs opacity-70">
              ({filter.id === 'all' 
                ? departments.length
                : filter.id === 'sale' 
                  ? counts.sales 
                  : counts.production})
            </span>
          </button>
        ))}
      </div>
      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام بخش
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
                placeholder="نام بخش را وارد کنید"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
              {errors.similar && (
                <p className="mt-1 text-sm text-orange-500">{errors.similar}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نوع بخش
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'sale' | 'production' 
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="sale">فروش</option>
                <option value="production">تولید</option>
              </select>
            </div>
          </div>

          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 
                         dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                       rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              {editingDepartment ? 'بروزرسانی' : 'ذخیره'}
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
      {/* Departments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نام بخش
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نوع
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredDepartments.map(department => (
              <tr key={department.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {department.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    department.type === 'sale'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {department.type === 'sale' ? 'فروش' : 'تولید'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(department)}
                      className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({
                        isOpen: true,
                        departmentId: department.id,
                        departmentName: department.name
                      })}
                      className="p-1 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDepartments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  موردی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        itemName={showDeleteConfirm.departmentName}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, departmentId: '', departmentName: '' })}
      />
    </div>
  );
}