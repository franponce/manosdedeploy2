import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Box,
  Flex,
  useToast,
  Radio,
  RadioGroup,
  Textarea,
  Divider,
  Icon,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
} from '@chakra-ui/react';
import { CartItem } from '../types';
import { parseCurrency } from '../../utils/currency';
import { INFORMATION } from '../../app/constants';
import { getPaymentMethods, PaymentMethods } from '../../utils/firebase';
import { FaArrowLeft, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { useSiteInfo } from '@/hooks/useSiteInfo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (product: CartItem) => void;
  onDecrement: (product: CartItem) => void;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
  const [isLoadingStock, setIsLoadingStock] = useState<{ [key: string]: boolean }>({});
  const [stockLevels, setStockLevels] = useState<{ [key: string]: number }>({});
  const [note, setNote] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isFullNameError, setIsFullNameError] = useState<boolean>(false);
  const toast = useToast();
  const { siteInfo } = useSiteInfo();

  // Función para obtener stock de un solo producto
  const fetchProductStock = async (productId: string) => {
    try {
      setIsLoadingStock(prev => ({ ...prev, [productId]: true }));
      const response = await fetch(`/api/products/${productId}/stock`);
      if (!response.ok) throw new Error('Error al obtener stock');
      const { stock } = await response.json();
      setStockLevels(prev => ({ ...prev, [productId]: Number(stock) }));
    } catch (error) {
      console.error(`Error al obtener stock para producto ${productId}:`, error);
      // Mantener el stock anterior si hay error
      setStockLevels(prev => ({ ...prev, [productId]: prev[productId] || 0 }));
    } finally {
      setIsLoadingStock(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Efecto para cargar el stock cuando se abre el drawer
  useEffect(() => {
    if (isOpen && items.length > 0) {
      items.forEach(item => {
        if (!isLoadingStock[item.id]) {
          fetchProductStock(item.id);
        }
      });
    }
  }, [isOpen, items]);

  const handleIncrement = async (product: CartItem) => {
    const currentStock = stockLevels[product.id];
    
    if (isLoadingStock[product.id]) {
      toast({
        title: "Cargando stock",
        description: "Por favor, espera mientras verificamos el stock disponible",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (currentStock === undefined) {
      await fetchProductStock(product.id);
      return;
    }

    if (product.quantity >= currentStock) {
      toast({
        title: "Stock máximo alcanzado",
        description: "Has alcanzado el máximo de unidades disponibles",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onIncrement(product);
  };

  const renderStockInfo = (item: CartItem) => {
    if (isLoadingStock[item.id]) {
      return (
        <Text 
          fontSize="xs" 
          color="gray.500"
          fontWeight="medium"
        >
          Verificando stock...
        </Text>
      );
    }

    const currentStock = stockLevels[item.id];
    if (currentStock === undefined) {
      return null;
    }

    const remainingStock = Math.max(0, currentStock - item.quantity);

    if (remainingStock === 0) {
      return (
        <Text 
          fontSize="xs" 
          color="orange.500"
          fontWeight="medium"
        >
          Llegaste al máximo de unidades disponibles
        </Text>
      );
    }

    if (remainingStock === 1) {
      return (
        <Text 
          fontSize="xs" 
          color="orange.500"
          fontWeight="medium"
        >
          ¡Última unidad disponible!
        </Text>
      );
    }

    return (
      <Text 
        fontSize="xs" 
        color="green.500"
        fontWeight="medium"
      >
        Stock disponible: {remainingStock} unidades
      </Text>
    );
  };

  const total = useMemo(
    () => parseCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0)),
    [items]
  );

  const handleWhatsAppRedirect = () => {
    if (!fullName.trim()) {
      setIsFullNameError(true);
      return;
    }
    setIsFullNameError(false);

    const whatsappMessage = encodeURIComponent(
      `*Simple E-commerce | ${siteInfo?.title || 'Tienda'} | Nuevo pedido*\n\n` +
      `¡Hola! Me gustaría realizar el siguiente pedido:\n\n${items
        .map(
          (item) =>
            `${item.title} (x${item.quantity}) - ${parseCurrency(
              item.price * item.quantity
            )} ${siteInfo?.currency}`
        )
        .join("\n")}\n\n` +
      `-- \n\n` +
      `*Detalle de la compra*\n\n` +
      `Nombre completo: ${fullName}\n` +
      `Aclaración: ${note.trim() || 'Sin aclaración'}\n` +
      `*Total: ${total} ${siteInfo?.currency}*`
    );
    const whatsappURL = `https://wa.me/${INFORMATION.whatsappCart}?text=${whatsappMessage}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Flex align="center">
              <Icon as={FaShoppingCart} mr={2} />
              <Text>Tu carrito</Text>
            </Flex>
          </DrawerHeader>

          <Divider />

          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {items.length > 0 ? (
                items.map((item) => (
                  <Flex key={item.id} justify="space-between" align="flex-start">
                    <Image 
                      src={item.image} 
                      alt={item.title} 
                      boxSize="50px" 
                      objectFit="cover" 
                      mr={2} 
                      flexShrink={0}
                    />
                    <Box flex={1} minWidth={0}>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        lineHeight="short"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text fontSize="sm">{parseCurrency(item.price)} {siteInfo?.currency}</Text>
                      {renderStockInfo(item)}
                    </Box>
                    <HStack flexShrink={0}>
                      <Button size="sm" onClick={() => onDecrement(item)}>-</Button>
                      <Text>{item.quantity}</Text>
                      <Button 
                        size="sm" 
                        onClick={() => handleIncrement(item)}
                        isDisabled={isLoadingStock[item.id] || item.quantity >= (stockLevels[item.id] || 0)}
                      >
                        +
                      </Button>
                    </HStack>
                  </Flex>
                ))
              ) : (
                <Text textAlign="center">Tu carrito está vacío</Text>
              )}

              <Divider />

              <FormControl isInvalid={isFullNameError} isRequired>
                <FormLabel>Nombre completo</FormLabel>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                />
                {isFullNameError && (
                  <FormErrorMessage>El nombre completo es requerido</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Aclaración (opcional)</FormLabel>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agrega una aclaración si lo deseas"
                />
              </FormControl>
            </VStack>
          </DrawerBody>

          <DrawerFooter flexDirection="column">
            <Divider mb={4} />
            <Flex justify="space-between" width="100%" mb={4}>
              <Text fontWeight="bold">Total:</Text>
              <Text fontWeight="bold">{total} {siteInfo?.currency}</Text>
            </Flex>
            <Button
              colorScheme="green"
              width="100%"
              onClick={handleWhatsAppRedirect}
              isDisabled={items.length === 0 || !fullName.trim()}
              leftIcon={<Icon as={FaWhatsapp} />}
              mb={2}
            >
              Enviar pedido por WhatsApp
            </Button>
            <Button
              variant="outline"
              width="100%"
              onClick={onClose}
              leftIcon={<Icon as={FaArrowLeft} />}
            >
              Seguir comprando
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;
