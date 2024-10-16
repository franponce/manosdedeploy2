import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import ProductCard from "./ProductCard";
import { Product } from "../types";
import { getProducts } from "../../utils/googleSheets";

interface ProductManagementProps {
  onCreateProduct: () => void;
}

const PRODUCTS_PER_PAGE = 30;

const ProductManagement: React.FC<ProductManagementProps> = ({ onCreateProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  if (isLoading) {
    return <Text>Cargando productos...</Text>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <Grid
        templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
        }}
        gap={6}
      >
        {paginatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} isAdmin={true} />
        ))}
      </Grid>
      {totalPages > 1 && (
        <HStack justifyContent="center" spacing={2} mt={4}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              onClick={() => setCurrentPage(page)}
              colorScheme={currentPage === page ? "blue" : "gray"}
            >
              {page}
            </Button>
          ))}
        </HStack>
      )}
      {products.length === 0 && (
        <Box textAlign="center">
          <Text mb={4}>No hay productos. ¿Quieres crear uno?</Text>
          <Button onClick={onCreateProduct} colorScheme="blue">
            Crear Producto
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default ProductManagement;
