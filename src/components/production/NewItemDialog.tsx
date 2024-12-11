// src/components/production/NewItemDialog.tsx
import React from 'react';

interface NewItemDialogProps {
  isOpen: boolean;
  type: 'product' | 'material';
  onClose: () => void;
  onConfirm: (item: { name: string; code: string; department: string; price: number }) => void;
  departments: string[];
}

const NewItemDialog: React.FC<NewItemDialogProps> = ({
  isOpen,
  type,
  onClose,
  onConfirm,
  departments
}) => {
  if (!isOpen) return null;

  // Minimal placeholder content
  return (
    <div style={{ background: '#fff', padding: '20px', border: '1px solid #ccc' }}>
      <h2>New {type === 'product' ? 'Product' : 'Material'}</h2>
      <button onClick={onClose}>Close</button>
      {/* A simple confirm button with hardcoded values for demonstration */}
      <button 
        onClick={() => onConfirm({ 
          name: 'New Item', 
          code: 'CODE', 
          department: departments[0] || '', 
          price: 0 
        })}
      >
        Confirm
      </button>
    </div>
  );
};

export default NewItemDialog;
