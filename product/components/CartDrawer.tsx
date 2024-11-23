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
import { getPaymentMethods, PaymentMethods, stockService } from '../../utils/firebase';
import { FaArrowLeft, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { useStock } from '@/hooks/useStock';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (product: CartItem) => void;
  onDecrement: (product: CartItem) => void;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    mercadoPago: false,
    cash: false,
    bankTransfer: false,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isFullNameError, setIsFullNameError] = useState<boolean>(false);
  const toast = useToast();
  const { siteInfo } = useSiteInfo();

  useEffect(() => {
    fetchPaymentMethods();
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    const methods = await getPaymentMethods();
    setPaymentMethods(methods);
  };

  const total = useMemo(
    () => parseCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0)),
    [items]
  );

  const handleIncrement = async (item: CartItem) => {
    try {
      const currentStock = await stockService.getProductStock(item.id);
      const currentQuantity = item.quantity;

      if (currentQuantity >= currentStock) {
        toast({
          title: "Stock no disponible",
          description: "No hay más unidades disponibles de este producto",
          status: "warning",
          duration: 3000,
        });
        return;
      }

      const reserved = await stockService.reserveStock(item.id, 1);
      
      if (!reserved) {
        toast({
          title: "Error al reservar stock",
          description: "No se pudo reservar el producto, intente nuevamente",
          status: "error",
          duration: 3000,
        });
        return;
      }

      onIncrement(item);
    } catch (error) {
      console.error('Error al manejar el stock:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar el carrito",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleDecrement = (item: CartItem) => {
    onDecrement(item);
  };

  const validateCartStock = async (): Promise<boolean> => {
    for (const item of items) {
      const currentStock = await stockService.getProductStock(item.id);
      if (item.quantity > currentStock) {
        toast({
          title: "Stock insuficiente",
          description: `No hay suficiente stock de ${item.title}`,
          status: "error",
          duration: 3000,
        });
        return false;
      }
    }
    return true;
  };

  const handleWhatsAppRedirect = async () => {
    if (!fullName.trim()) {
      setIsFullNameError(true);
      return;
    }
    
    const stockValid = await validateCartStock();
    if (!stockValid) return;

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
      `Método de pago: ${selectedPaymentMethod}\n` +
      `Aclaración: ${note.trim() || 'Sin aclaración'}\n` +
      `*Total: ${total} ${siteInfo?.currency}*`
    );
    const whatsappURL = `https://wa.me/${INFORMATION.whatsappCart}?text=${whatsappMessage}`;
    
    try {
      for (const item of items) {
        await stockService.updateStock(item.id, -item.quantity);
      }
      window.open(whatsappURL, "_blank");
      onClose();
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la compra",
        status: "error",
        duration: 3000,
      });
    }
  };

  const getFirstImage = (images: string | string[]): string => {
    if (typeof images === 'string') {
      const matches = images.match(/data:image\/[^;]+;base64,[^,]+/g);
      if (matches && matches.length > 0) {
        return matches[0];
      }
      return images;
    }
    if (Array.isArray(images) && images.length > 0) {
      return images[0];
    }
    return '';
  };

  const renderTitle = (item: CartItem) => {
    return (
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
    );
  };

  const handleQuantityChange = async (item: CartItem, newValue: string) => {
    if (!/^\d*$/.test(newValue)) return;
    
    const newQuantity = newValue === '' ? 0 : parseInt(newValue, 10);
    const currentQuantity = item.quantity;
    
    try {
      if (newQuantity > currentQuantity) {
        const currentStock = await stockService.getProductStock(item.id);
        if (newQuantity > currentStock) {
          toast({
            title: "Stock no disponible",
            description: `Solo hay ${currentStock} unidades disponibles`,
            status: "warning",
            duration: 3000,
          });
          return;
        }
      }
      
      const difference = newQuantity - currentQuantity;
      if (difference > 0) {
        for (let i = 0; i < difference; i++) {
          await onIncrement(item);
        }
      } else if (difference < 0) {
        for (let i = 0; i < Math.abs(difference); i++) {
          await onDecrement(item);
        }
      }
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        status: "error",
        duration: 3000,
      });
    }
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
                      src={getFirstImage(item.images)}
                      alt={item.title} 
                      boxSize="50px" 
                      objectFit="cover" 
                      mr={2}
                      flexShrink={0}
                      fallback={<Box bg="gray.200" boxSize="50px" />}
                    />
                    <Box flex={1} minWidth={0}>
                      {renderTitle(item)}
                      <Text fontSize="sm">{parseCurrency(item.price)} {siteInfo?.currency}</Text>
                    </Box>
                    <HStack flexShrink={0}>
                      <Button 
                        size="sm" 
                        onClick={() => handleDecrement(item)}
                      >
                        -
                      </Button>
                      <Input
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item, e.target.value)}
                        size="sm"
                        width="50px"
                        textAlign="center"
                        p={1}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleIncrement(item)}
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

              <FormControl isRequired>
                <FormLabel>Método de pago</FormLabel>
                <RadioGroup onChange={setSelectedPaymentMethod} value={selectedPaymentMethod}>
                  <VStack align="start">
                    {paymentMethods.mercadoPago && (
                      <Radio value="MercadoPago">MercadoPago</Radio>
                    )}
                    {paymentMethods.cash && (
                      <Radio value="Efectivo">Efectivo</Radio>
                    )}
                    {paymentMethods.bankTransfer && (
                      <Radio value="Transferencia bancaria">Transferencia bancaria</Radio>
                    )}
                  </VStack>
                </RadioGroup>
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
              isDisabled={items.length === 0 || !selectedPaymentMethod || !fullName.trim()}
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
