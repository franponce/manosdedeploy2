import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  Stack,
  Text,
  Box,
  Heading,
  useToast,
  Center,
  Spinner,
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Icon,
  Image,
  Container,
  SimpleGrid,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { CartItem, Product, Category } from "../types";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { editCart } from "../selectors";
import { parseCurrency } from "../../utils/currency";
import useSWR, { mutate } from 'swr';
import { useCart } from '../../hooks/useCart';
import { SWR_KEYS } from '../constants';
import SiteInfoBanner from '../../components/SiteInfoBanner';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { useRouter } from 'next/router';
import { useStock } from '../../hooks/useStock';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useProductsStock } from '../../hooks/useProductsStock';
import { stockService } from '../../utils/firebase';
import { useProducts } from '../../hooks/useProducts';
import LoadingOverlay from '../../components/LoadingOverlay';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  
  return data
    .map((product: Product) => ({
      ...product,
      isVisible: product.isVisible === undefined ? true : product.isVisible === true
    }))
    .sort((a: Product, b: Product) => {
      // Ordenar por el ID numérico (que refleja el orden en la hoja)
      return parseInt(a.id) - parseInt(b.id);
    });
};

const PRODUCTS_PER_PAGE = 12;

interface StoreScreenProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

const CART_STORAGE_KEY = 'simple-ecommerce-cart';
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

const StoreScreen: React.FC<StoreScreenProps> = ({ initialProducts, initialCategories }) => {
  const { products, isLoading: productsLoading } = useProducts(initialProducts);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

  // Efecto para procesar los productos
  useEffect(() => {
    if (!products) return;

    const processProducts = () => {
      console.log('Productos recibidos:', products);

      const filteredProducts = products.filter(product => {
        const isValid = Boolean(
          product?.id &&
          product?.title &&
          product?.images?.length > 0 &&
          product?.price > 0 &&
          product?.isVisible !== false
        );

        if (!isValid) {
          console.log('Producto filtrado por validación:', {
            id: product?.id,
            hasTitle: Boolean(product?.title),
            hasImages: Boolean(product?.images?.length > 0),
            hasPrice: Boolean(product?.price > 0),
            isVisible: product?.isVisible !== false
          });
        }

        return isValid;
      });

      console.log('Productos filtrados:', filteredProducts);
      setDisplayedProducts(filteredProducts);
    };

    processProducts();
  }, [products]);

  if (productsLoading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      {displayedProducts.length > 0 ? (
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
          spacing={6}
          padding={4}
        >
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={function (product: Product): void {
              throw new Error("Function not implemented.");
            } } isLoading={false} onEdit={function (): void {
              throw new Error("Function not implemented.");
            } } onDelete={function (): void {
              throw new Error("Function not implemented.");
            } } onVisibilityToggle={function (): void {
              throw new Error("Function not implemented.");
            } } isAdminView={false} />
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={10}>
          <Text>No se encontraron productos disponibles.</Text>
        </Box>
      )}
    </>
  );
};

export default StoreScreen;