export interface Recipe {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  category: string;
  type: 'product';
  createdAt?: number;
  updatedAt?: number;
  isActive?: boolean;
} 