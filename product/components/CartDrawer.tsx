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
  const [sessionId] = useState<string>(() => 
    localStorage.getItem('sessionId') || crypto.randomUUID()
  );
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
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);

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
            {/* ... contenido del drawer ... */}
          </DrawerBody>
          <DrawerFooter>
            {/* ... footer del drawer ... */}
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;
