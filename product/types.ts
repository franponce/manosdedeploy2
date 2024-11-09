export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  isScheduled: boolean;
  scheduledPublishDate: Date | null;
  categoryId: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductOrder {
  id: string;
  position: number;
  categoryId?: string;
  updatedAt: string;
}

export interface ProductOrderSettings {
  defaultSort: 'position' | 'newest' | 'price_asc' | 'price_desc' | 'name';
  categorySort?: {
    [categoryId: string]: 'position' | 'newest' | 'price_asc' | 'price_desc' | 'name';
  }
}
