export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  categoryId: string;
  isVisible: boolean;
  order?: string;
  stock: number;
  currency: string;
  // Campos opcionales para futuras features
  // scheduledPublishDate?: string;
  // isScheduled?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}