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
import { useSessionId } from '@/hooks/useSessionId';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (product: CartItem) => void;
  onDecrement: (product: CartItem) => void;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
  const { sessionId, isReady } = useSessionId();
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

  const handleAction = async (action: () => Promise<void>) => {
    if (!isReady) {
      toast({
        title: "Espera un momento",
        description: "Inicializando sesión...",
        status: "info",
        duration: 2000,
      });
      return;
    }
    await action();
  };

  const createWhatsAppMessage = (
    items: CartItem[], 
    fullName: string, 
    note: string, 
    paymentMethod: string
  ): string => {
    return encodeURIComponent(
      `*Simple E-commerce | ${siteInfo?.title || 'Tienda'} | Nuevo pedido*\n\n` +
      `¡Hola! Me gustaría realizar el siguiente pedido:\n\n${items
        .map(
          (item) =>
            `${item.title} (x${item.quantity}) - ${parseCurrency(
              item.price * item.quantity
            )} ${siteInfo?.currency}`
        )
        .join("\n")}\n\n` +
      `*Total: ${items.reduce((sum, item) => sum + item.price * item.quantity, 0)} ${siteInfo?.currency}*\n\n` +
      `Nombre: ${fullName}\n` +
      `Método de pago: ${paymentMethod}\n` +
      (note ? `Nota: ${note}` : '')
    );
  };

  const handleWhatsAppRedirect = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Por favor, intenta nuevamente en unos segundos",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!fullName.trim()) {
      setIsFullNameError(true);
      return;
    }
    
    const stockValid = await validateCartStock();
    if (!stockValid) return;

    try {
      for (const item of items) {
        const success = await stockService.confirmPurchase(
          item.id,
          item.quantity,
          sessionId
        );
        
        if (!success) {
          throw new Error(`Failed to confirm purchase for ${item.title}`);
        }
      }

      const whatsappMessage = createWhatsAppMessage(items, fullName, note, selectedPaymentMethod);
      const whatsappURL = `https://wa.me/${siteInfo?.whatsappCart}?text=${whatsappMessage}`;
      
      window.open(whatsappURL, "_blank");
      onClose();
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la compra. Por favor, intente nuevamente.",
        status: "error",
        duration: 3000,
      });
    }
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

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="md">
      <DrawerOverlay>
        <DrawerContent>
          <DrawerHeader>Tu carrito</DrawerHeader>
          <DrawerCloseButton />
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {items.map((item) => (
                <Box key={item.id} p={4} borderWidth={1} borderRadius="md">
                  <HStack spacing={4}>
                    {item.images?.[0] && (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" flex={1}>
                      <Text fontWeight="bold">{item.title}</Text>
                      <Text>{parseCurrency(item.price)} {siteInfo?.currency}</Text>
                      <HStack>
                        <Button size="sm" onClick={() => onDecrement(item)}>-</Button>
                        <Text>{item.quantity}</Text>
                        <Button size="sm" onClick={() => onIncrement(item)}>+</Button>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              ))}

              <Divider />

              <FormControl isInvalid={isFullNameError}>
                <FormLabel>Nombre completo</FormLabel>
                <Input
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setIsFullNameError(false);
                  }}
                  placeholder="Ingresa tu nombre completo"
                />
                {isFullNameError && (
                  <FormErrorMessage>El nombre es requerido</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Método de pago</FormLabel>
                <RadioGroup value={selectedPaymentMethod} onChange={setSelectedPaymentMethod}>
                  <VStack align="start">
                    {paymentMethods.mercadoPago && (
                      <Radio value="MercadoPago">MercadoPago</Radio>
                    )}
                    {paymentMethods.cash && (
                      <Radio value="Efectivo">Efectivo</Radio>
                    )}
                    {paymentMethods.bankTransfer && (
                      <Radio value="Transferencia">Transferencia bancaria</Radio>
                    )}
                  </VStack>
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Nota (opcional)</FormLabel>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Agrega una nota a tu pedido"
                />
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter>
            <VStack width="100%" spacing={4}>
              <HStack width="100%" justify="space-between">
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold">
                  {parseCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0))} {siteInfo?.currency}
                </Text>
              </HStack>
              <Button
                width="100%"
                colorScheme="whatsapp"
                leftIcon={<Icon as={FaWhatsapp} />}
                onClick={handleWhatsAppRedirect}
                isDisabled={!selectedPaymentMethod || items.length === 0}
              >
                Completar pedido
              </Button>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;
