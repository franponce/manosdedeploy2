import { Product, ProductOrder, ProductOrderSettings } from '../product/types';

export const sortProducts = (
  products: Product[],
  productOrders: ProductOrder[],
  orderSettings: ProductOrderSettings
): Product[] => {
  const orderMap = new Map(productOrders.map(order => [order.id, order.position]));

  return [...products].sort((a, b) => {
    switch (orderSettings.defaultSort) {
      case 'position':
        return (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0);
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
};

export const calculateNewOrder = (
  sourceIndex: number,
  destinationIndex: number,
  currentOrders: ProductOrder[]
): Partial<ProductOrder>[] => {
  const newOrders = [...currentOrders];
  const [removed] = newOrders.splice(sourceIndex, 1);
  newOrders.splice(destinationIndex, 0, removed);

  return newOrders.map((order, index) => ({
    id: order.id,
    position: index,
    updatedAt: new Date().toISOString()
  }));
}; 