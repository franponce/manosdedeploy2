import React, { useState, useEffect } from "react";
import { Box, SimpleGrid, Button, Flex, Input, IconButton, VStack } from "@chakra-ui/react";
import { SearchIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import ProductCard from "./ProductCard";
import { Product } from "../types";
import { getProducts, deleteProduct } from "../../utils/googleSheets";

const PRODUCTS_PER_PAGE = 12;

const ProductManagement: React.FC<{ onCreateProduct: () => void, onEditProduct: (product: Product) => void }> = ({ onCreateProduct, onEditProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const results = products.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleDelete = async (productId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteProduct(productId);
        setProducts(products.filter(product => product.id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  return (
    <VStack spacing={4}>
      <Flex width="100%" mb={4}>
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          mr={2}
        />
        <IconButton
          aria-label="Search products"
          icon={<SearchIcon />}
          onClick={() => {/* Implementar búsqueda si es necesario */}}
        />
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
        {currentProducts.map((product) => (
          <Box key={product.id} position="relative">
            <ProductCard product={product} onAdd={() => {}} isLoading={isLoading} />
            <Flex position="absolute" top={2} right={2}>
              <IconButton
                aria-label="Edit product"
                icon={<EditIcon />}
                onClick={() => onEditProduct(product)}
                mr={2}
              />
              <IconButton
                aria-label="Delete product"
                icon={<DeleteIcon />}
                onClick={() => handleDelete(product.id)}
              />
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
      <Flex justifyContent="center" mt={4}>
        {Array.from({ length: Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) }, (_, i) => (
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
    </VStack>
  );
};

export default ProductManagement;
