import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { db } from '../../database';
import type { Item } from '../../database/types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import NewItemDialog from './NewItemDialog';

export default function InventoryOverview() {
  const [materials, setMaterials] = useState<Item[]>([]);
  const [editingMaterial, setEditingMaterial] = useState<Item | null>(null);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load only materials
    setMaterials(db.getMaterials());

    // Get unique departments from materials
    const allItems = [...db.getMaterials()];
    const uniqueDepartments = Array.from(new Set(allItems.map(item => item.department)));
    setDepartments(uniqueDepartments);
  };

  const handleAddItem = (item: { name: string; code: string; department: string; price: number }) => {
    const newMaterial = db.addMaterial({ ...item, type: 'material' });
    setMaterials([...materials, newMaterial]);
    setShowNewItemDialog(false);
  };

  const handleDelete = () => {
    if (db.deleteMaterial(deleteConfirm.id)) {
      setMaterials(materials.filter(p => p.id !== deleteConfirm.id));
    }
    setDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Materials Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">مواد اولیه</h2>
          <button
            onClick={() => setShowNewItemDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                     rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            افزودن ماده اولیه
          </button>
        </div>
        
        {/* Materials List */}
        <div className="space-y-4">
          {materials.map(material => (
            <div key={material.id} className="relative p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{material.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">کد: {material.code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    بخش: {material.department}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    قیمت: {material.price.toLocaleString()} ریال
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      id: material.id,
                      name: material.name,
                    })}
                    className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Item Dialog */}
      {showNewItemDialog && (
        <NewItemDialog
          isOpen={true}
          type="material"
          onClose={() => setShowNewItemDialog(false)}
          onConfirm={handleAddItem}
          departments={departments}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}