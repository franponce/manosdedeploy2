import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useProductOrder } from '@/hooks/useProductOrder';
import { useProducts } from '@/hooks/useProducts';
import { calculateNewOrder } from '@/utils/productSort';
import { Product, ProductOrder } from '@/product/types';

export function ProductOrderManager() {
  const { products } = useProducts();
  const { productOrders, updateProductOrder } = useProductOrder();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !productOrders) return;

    const updates = calculateNewOrder(
      result.source.index,
      result.destination.index,
      productOrders
    );
    
    updateProductOrder(updates);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Ordenar Productos</h2>
        <select className="border p-2 rounded">
          <option value="custom">Orden Personalizado</option>
          <option value="newest">Más Recientes</option>
          <option value="price_asc">Precio: Menor a Mayor</option>
          <option value="price_desc">Precio: Mayor a Menor</option>
          <option value="name">Alfabético</option>
        </select>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="products">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {products.map((product: Product, index: number) => (
                <Draggable 
                  key={product.id} 
                  draggableId={product.id} 
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center p-4 mb-2 bg-white rounded shadow"
                    >
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded mr-4" 
                      />
                      <span>{product.title}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
} 