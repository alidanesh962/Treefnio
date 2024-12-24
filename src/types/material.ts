export interface Material {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 