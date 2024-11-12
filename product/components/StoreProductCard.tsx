import ProductCard from './ProductCard';
import { Product } from '../types';

interface StoreProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  onAdd,
  isLoading
}) => {
  return (
    <ProductCard
      product={product}
      onAdd={onAdd}
      isLoading={isLoading}
      onEdit={() => {}}
      onDelete={() => {}}
      onVisibilityToggle={() => {}}
      isAdminView={false}
    />
  );
}; 