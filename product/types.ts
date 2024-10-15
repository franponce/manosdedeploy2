export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  scheduledPublishDate?: Date | null; 
}

export interface CartItem extends Product {
  quantity: number;
}
