export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  scheduledPublishDate?: Date | null;
  isScheduled: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}
