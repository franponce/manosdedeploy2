export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  isScheduled: boolean;
  scheduledPublishDate: Date | null;
}

export interface CartItem extends Product {
  quantity: number;
}
