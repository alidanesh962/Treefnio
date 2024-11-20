import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { db } from '../../database';

interface DepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

function DepartmentDialog({ isOpen, onClose, onConfirm }: DepartmentDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    try {
      if (!name.trim()) {
        setError('نام بخش الزامی است');
        return;
      }

      // Add the department to the database and call onConfirm
      onConfirm(name.trim());
      
      // Reset form and close
      setName('');
      setError('');
      onClose();
    } catch (error) {
      console.error('Error adding department:', error);
      setError('خطا در ثبت بخش جدید');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium text-white mb-4">
          افزودن بخش جدید
        </h3>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          className="w-full px-3 py-2 rounded-lg border border-gray-600 
                   bg-gray-700 text-white mb-4"
          placeholder="نام بخش"
          autoFocus
        />
        {error && (
          <p className="mt-1 text-sm text-red-500 mb-4">{error}</p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            تایید
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewItemDialogProps {
  isOpen: boolean;
  type: 'product' | 'material';
  onClose: () => void;
  onConfirm: (item: { name: string; code: string; department: string; price: number }) => void;
  departments: string[];
}

export default function NewItemDialog({
  isOpen,
  type,
  onClose,
  onConfirm,
  departments
}: NewItemDialogProps) {
  const [localDepartments, setLocalDepartments] = useState(departments);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: departments[0] || '',
    price: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeptDialog, setShowDeptDialog] = useState(false);

  // Update localDepartments when departments prop changes
  useEffect(() => {
    setLocalDepartments(departments);
  }, [departments]);

  if (!isOpen) return null;

  const handleAddDepartment = (name: string) => {
    try {
      // Add department to database
      const newDept = db.addDepartment(name, type === 'product' ? 'sale' : 'production');
      
      // Update local departments list
      const updatedDepartments = [...localDepartments, newDept.name];
      setLocalDepartments(updatedDepartments);
      
      // Set the new department as selected
      setFormData(prev => ({ ...prev, department: newDept.name }));
      
      // Close the dialog
      setShowDeptDialog(false);
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowDeptDialog(true);
    } else {
      setFormData(prev => ({ ...prev, department: value }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام الزامی است';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'کد الزامی است';
    }
    if (!formData.department) {
      newErrors.department = 'انتخاب بخش الزامی است';
    }
    if (formData.price <= 0) {
      newErrors.price = 'قیمت باید بزرگتر از صفر باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setErrors({});

      if (!validate()) {
        return;
      }

      onConfirm(formData);
      setFormData({
        name: '',
        code: '',
        department: localDepartments[0] || '',
        price: 0
      });
    } catch (error) {
      console.error('Error adding item:', error);
      setErrors({ submit: 'خطا در ثبت اطلاعات' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white">
              {type === 'product' ? 'افزودن کالای جدید' : 'افزودن متریال جدید'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                نام
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 
                         bg-gray-700 text-white"
                placeholder={type === 'product' ? 'نام کالا' : 'نام متریال'}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                کد
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 
                         bg-gray-700 text-white"
                placeholder="کد محصول"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                گروه
              </label>
              <select
                value={formData.department}
                onChange={handleDepartmentChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 
                         bg-gray-700 text-white"
              >
                <option value="">انتخاب گروه...</option>
                {localDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                <option value="new">+ افزودن گروه جدید</option>
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-500">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                قیمت (ریال)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-600 
                         bg-gray-700 text-white"
                min="0"
                step="1000"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            {errors.submit && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {isSubmitting ? 'در حال ثبت...' : 'تایید'}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>

      <DepartmentDialog
        isOpen={showDeptDialog}
        onClose={() => setShowDeptDialog(false)}
        onConfirm={handleAddDepartment}
      />
    </>
  );
}