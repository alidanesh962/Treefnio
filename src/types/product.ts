export interface Recipe {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  recipe?: Recipe[];
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 