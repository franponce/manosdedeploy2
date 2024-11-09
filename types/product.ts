interface ProductOrder {
  id: string;
  position: number;
  categoryId?: string; // Para ordenar dentro de categorías
  updatedAt: Date;
}

interface ProductOrderSettings {
  defaultSort: 'position' | 'newest' | 'price_asc' | 'price_desc' | 'name';
  categorySort?: {
    [categoryId: string]: 'position' | 'newest' | 'price_asc' | 'price_desc' | 'name';
  }
} 