export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  categoryId?: string;
  isVisible: boolean;
  isScheduled?: boolean;
  scheduledPublishDate?: string | null;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}
