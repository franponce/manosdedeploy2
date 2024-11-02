export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  categoryId?: string;
  isScheduled?: boolean;
  scheduledPublishDate?: Date | null;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}
