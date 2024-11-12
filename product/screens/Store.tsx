import { useState } from "react";
import {
  Button,
  Flex,
  Grid,
  Stack,
  Text,
  Box,
  Heading,
  Center,
  Spinner,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Icon,
  useToast as ChakraToast,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { CartItem, Product, Category } from "../types";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { parseCurrency } from "../../utils/currency";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import React from "react";

interface StoreScreenProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

const StoreScreen: React.FC<StoreScreenProps> = ({ 
  initialProducts,
  initialCategories 
}) => {
  const toast = ChakraToast();
  const { products = initialProducts, isLoading } = useProducts(true);
  const { categories = initialCategories } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>([]);

  // Efecto para filtrar productos
  React.useEffect(() => {
    if (products) {
      let filteredProducts = products.filter(product =>
        product && 
        product.id && 
        product.title && 
        product.image && 
        product.price && 
        !product.isScheduled &&
        product.isVisible && // Agregamos esta condición
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.categoryId === selectedCategory
        );
      }

      setDisplayedProducts(filteredProducts);
    }
  }, [products, searchTerm, selectedCategory]);

  return (
    <Stack spacing={6}>
      {/* Aquí va el resto del JSX */}
    </Stack>
  );
};

export default StoreScreen;
