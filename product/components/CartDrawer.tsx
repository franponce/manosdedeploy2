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
  IconButton,
} from '@chakra-ui/react';
import { CartItem } from '../types';
import { parseCurrency } from '../../utils/currency';
import { INFORMATION } from '../../app/constants';
import { getPaymentMethods, PaymentMethods, stockService } from '../../utils/firebase';
import { FaArrowLeft, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { useStock } from '@/hooks/useStock';
import { useSessionId } from '@/hooks/useSessionId';
import { useCart } from '@/hooks/useCart';
import { MinusIcon, AddIcon } from '@chakra-ui/icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (product: CartItem) => void;
  onDecrement: (product: CartItem) => void;
}

const generateWhatsAppText = (
  items: CartItem[],
  fullName: string,
  paymentMethod: string,
  note: string,
  storeName: string = "Simple E-commerce"
): string => {
  const header = `${storeName} | Nuevo pedido\n\n¡Hola! Me gustaría realizar el siguiente pedido:\n\n`;
  
  const itemsList = items
    .map(item => `${item.title} (x${item.quantity}) - ${parseCurrency(item.price * item.quantity)}`)
    .join('\n');
  
  const details = `\n\n-- \n\nDetalle de la compra\n\n`;
  
  const customerInfo = [
    `Nombre completo: ${fullName}`,
    `Método de pago: ${paymentMethod}`,
    `Aclaración: ${note.trim() || 'Sin aclaración'}`,
    `Total: ${parseCurrency(items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}`
  ].join('\n');

  return `${header}${itemsList}${details}${customerInfo}`;
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

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
  const [tempQuantities, setTempQuantities] = useState<{ [key: string]: string }>({});
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
  const { sessionId, isReady } = useSessionId();
  const [isProcessing, setIsProcessing] = useState(false);
  const { clearCart } = useCart();

  useEffect(() => {
    if (isOpen) {
      const initialQuantities = items.reduce((acc, item) => ({
        ...acc,
        [item.id]: item.quantity.toString()
      }), {});
      setTempQuantities(initialQuantities);
    }
  }, [isOpen, items]);

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

  const handleQuantityChange = (item: CartItem, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setTempQuantities(prev => ({
        ...prev,
        [item.id]: value
      }));

      if (value === '') return;

      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const diff = numValue - item.quantity;
        if (diff > 0) {
          for (let i = 0; i < diff; i++) {
            onIncrement(item);
          }
        } else if (diff < 0) {
          for (let i = 0; i < Math.abs(diff); i++) {
            onDecrement(item);
          }
        }
      }
    }
  };

  const validateCartStock = async (): Promise<boolean> => {
    if (!isReady) {
      toast({
        title: "Espera un momento",
        description: "Inicializando sesión...",
        status: "info",
        duration: 2000,
      });
      return false;
    }

    for (const item of items) {
      const currentStock = await stockService.getAvailableStock(item.id);
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

  const createReservations = async (): Promise<boolean> => {
    for (const item of items) {
      try {
        const reserved = await stockService.reserveStock(
          item.id,
          item.quantity,
          sessionId
        );
        
        if (!reserved) {
          toast({
            title: "Error",
            description: `No se pudo reservar el producto ${item.title}`,
            status: "error",
            duration: 3000,
          });
          return false;
        }
      } catch (error) {
        console.error('Error reserving stock:', error);
        toast({
          title: "Error",
          description: `Error al reservar ${item.title}`,
          status: "error",
          duration: 3000,
        });
        return false;
      }
    }
    return true;
  };

  const handleWhatsAppRedirect = async () => {
    if (!isReady || !fullName.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa tu nombre",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Validar stock disponible
      const stockValid = await validateCartStock();
      if (!stockValid) {
        setIsProcessing(false);
        return;
      }

      // 2. Crear reservas para todos los items
      const reservationsCreated = await createReservations();
      if (!reservationsCreated) {
        setIsProcessing(false);
        return;
      }

      // 3. Confirmar cada item del carrito
      for (const item of items) {
        try {
          const confirmed = await stockService.confirmPurchase(
            item.id,
            item.quantity,
            sessionId
          );
          
          if (!confirmed) {
            throw new Error(`No se pudo confirmar la compra del producto ${item.title}`);
          }
        } catch (error) {
          console.error('Error confirming purchase:', error);
          // Intentar liberar las reservas
          items.forEach(async (cartItem) => {
            try {
              await stockService.releaseReservation(cartItem.id, sessionId);
            } catch (releaseError) {
              console.error('Error releasing reservation:', releaseError);
            }
          });

          toast({
            title: "Error",
            description: `No se pudo confirmar la compra de ${item.title}. Por favor, intenta nuevamente.`,
            status: "error",
            duration: 5000,
          });
          setIsProcessing(false);
          return;
        }
      }

      // 4. Si todo está bien, enviar mensaje de WhatsApp
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
      
      window.open(`https://wa.me/${INFORMATION.whatsappCart}?text=${whatsappMessage}`);
      clearCart();
      onClose();
      toast({
        title: "¡Pedido enviado!",
        description: "Tu pedido ha sido enviado correctamente",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu pedido. Por favor, intenta nuevamente.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="md">
      <DrawerContent>
        <DrawerHeader>
          <Text>Tu carrito</Text>
          <DrawerCloseButton />
        </DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            {items.map((item) => (
              <HStack key={item.id} spacing={4}>
                <Image
                  src={getFirstImage(item.images)}
                  alt={item.title}
                  boxSize="50px"
                  objectFit="cover"
                  mr={2}
                  flexShrink={0}
                  fallback={<Box bg="gray.200" boxSize="50px" />}
                />
                
                <VStack flex={1} align="flex-start" spacing={1}>
                  <Text fontWeight="bold">{item.title}</Text>
                  <Text color="gray.600">{parseCurrency(item.price)}</Text>
                </VStack>

                <HStack flexShrink={0}>
                  <IconButton
                    aria-label="Decrementar"
                    icon={<MinusIcon />}
                    onClick={() => onDecrement(item)}
                    size="sm"
                    variant="outline"
                  />
                  
                  <Input
                    value={tempQuantities[item.id] || ''}
                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                    size="sm"
                    width="50px"
                    textAlign="center"
                    p={1}
                  />
                  
                  <IconButton
                    aria-label="Incrementar"
                    icon={<AddIcon />}
                    onClick={() => onIncrement(item)}
                    size="sm"
                    variant="outline"
                  />
                </HStack>
                
                <Text fontWeight="bold">
                  {parseCurrency(item.price * item.quantity)}
                </Text>
              </HStack>
            ))}
          </VStack>
        </DrawerBody>

        <DrawerFooter>
          <VStack spacing={4} width="100%">
            <HStack justify="space-between" width="100%">
              <Text fontSize="lg" fontWeight="bold">Total:</Text>
              <Text fontSize="lg" fontWeight="bold">
                {parseCurrency(items.reduce((total, item) => total + (item.price * item.quantity), 0))}
              </Text>
            </HStack>
          </VStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;