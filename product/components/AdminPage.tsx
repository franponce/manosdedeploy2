import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Icon,
  useToast
} from '@chakra-ui/react';
import { FaSort } from 'react-icons/fa';
import { Product } from '../types';
import { ProductOrderModal } from './ProductOrderModal';

export function AdminPage() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Error al cargar productos');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error al cargar productos",
        status: "error",
        duration: 2000,
      });
    }
  };

  const handleSaveOrder = async (orderedProducts: Product[]) => {
    try {
      const response = await fetch('/api/products/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: orderedProducts }),
      });

      if (!response.ok) throw new Error('Error al actualizar orden');
      
      await fetchProducts(); // Recargar productos
      toast({
        title: "Orden actualizado",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Error al actualizar el orden",
        status: "error",
        duration: 2000,
      });
    }
  };

  return (
    <Box>
      {/* ... otros elementos ... */}
      
      <Button
        leftIcon={<Icon as={FaSort} />}
        onClick={() => setIsOrderModalOpen(true)}
        colorScheme="purple"
        mb={4}
      >
        Ordenar productos
      </Button>

      {isOrderModalOpen && products && (
        <ProductOrderModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          products={products}
          onSaveOrder={handleSaveOrder}
        />
      )}
      
      {/* ... resto del contenido ... */}
    </Box>
  );
}