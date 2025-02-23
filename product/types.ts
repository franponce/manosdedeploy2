export interface Product {
  order: string;
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  // Feature futura - Programación de productos
  // isScheduled: boolean;
  // scheduledPublishDate: Date | null;
  categoryId: string;
  isVisible: boolean;
  stock: number | '';
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}