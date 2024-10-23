import React, { useState, useEffect } from "react";
import { Box, SimpleGrid, Button, Flex } from "@chakra-ui/react";
import ProductCard from "./ProductCard";
import { Product } from "../types";
import { getProducts } from "../../utils/googleSheets";

const PRODUCTS_PER_PAGE = 12;

const ProductManagement: React.FC<{ onCreateProduct: () => void }> = ({ onCreateProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
        {currentProducts.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={() => {}} isLoading={isLoading} />
        ))}
      </SimpleGrid>
      <Flex justifyContent="center" mt={4}>
        {Array.from({ length: Math.ceil(products.length / PRODUCTS_PER_PAGE) }, (_, i) => (
          <Button
            key={i}
            mx={1}
            onClick={() => paginate(i + 1)}
            colorScheme={currentPage === i + 1 ? "blue" : "gray"}
          >
            {i + 1}
          </Button>
        ))}
      </Flex>
    </Box>
  );
};

export default ProductManagement;
