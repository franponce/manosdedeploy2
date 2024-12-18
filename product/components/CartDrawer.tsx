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
  const [processingItems, setProcessingItems] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchPaymentMethods();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      validateStock();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    const methods = await getPaymentMethods();
    setPaymentMethods(methods);
  };

  const total = useMemo(
    () => parseCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0)),
    [items]
  );

  const validateStock = async (): Promise<boolean> => {
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

  const handleWhatsAppRedirect = async () => {
    if (!fullName.trim()) {
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
      const isStockValid = await validateStock();
      if (!isStockValid) {
        setIsProcessing(false);
        return;
      }

      // 2. Decrementar stock de cada producto
      for (const item of items) {
        const currentStock = await stockService.getAvailableStock(item.id);
        const newStock = Math.max(0, currentStock - item.quantity);
        await stockService.updateStock(item.id, newStock);
      }

      // 3. Generar mensaje y redirigir a WhatsApp
      const whatsappMessage = encodeURIComponent(
        generateWhatsAppText(
          items,
          fullName,
          selectedPaymentMethod,
          note,
          siteInfo?.title
        )
      );
      
      // 4. Abrir WhatsApp en una nueva pestaña
      const whatsappWindow = window.open(`https://wa.me/${siteInfo?.whatsappCart}?text=${whatsappMessage}`, '_blank');
      
      // 5. Limpiar todo
      clearCart();
      localStorage.removeItem('cart');
      window.localStorage.clear();
      setFullName('');
      setNote('');
      setSelectedPaymentMethod('');
      
      // 6. Cerrar drawer y mostrar mensaje
      onClose();
      toast({
        title: "¡Pedido enviado!",
        description: "Tu pedido fue enviado correctamente",
        status: "success",
        duration: 3000,
        position: 'top',
      });

      // 7. Redirigir al home y recargar
      window.location.href = '/';
      
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

  // Limpiar al cerrar el drawer
  const handleClose = async () => {
    onClose();
  };

  const handleQuantityChange = async (item: CartItem, action: 'increment' | 'decrement') => {
    if (processingItems[item.id]) return;
    
    setProcessingItems(prev => ({ ...prev, [item.id]: true }));
    
    // Validar el stock antes de incrementar
    if (action === 'increment') {
      const currentStock = await stockService.getAvailableStock(item.id);
      if (item.quantity >= currentStock) {
        toast({
          title: "Stock insuficiente",
          description: `No hay suficiente stock de ${item.title}`,
          status: "error",
          duration: 3000,
        });
        setProcessingItems(prev => ({ ...prev, [item.id]: false }));
        return;
      }
    }
    
    // Siempre incrementar/decrementar de a 1
    if (action === 'increment') {
      await onIncrement({...item, quantity: 1});
    } else {
      await onDecrement({...item, quantity: 1});
    }
    
    setTimeout(() => {
      setProcessingItems(prev => ({ ...prev, [item.id]: false }));
    }, 250);
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

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} size="md">
      <DrawerContent>
        <DrawerHeader>
          <Flex align="center">
            <Icon as={FaShoppingCart} mr={2} />
            <Text>Tu carrito</Text>
          </Flex>
          <DrawerCloseButton />
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
                    <Text fontSize="sm" color="gray.600">
                      {parseCurrency(item.price)} {siteInfo?.currency}
                    </Text>
                  </Box>
                  <HStack flexShrink={0}>
                    <IconButton
                      aria-label="Decrementar"
                      icon={<MinusIcon />}
                      onClick={() => handleQuantityChange(item, 'decrement')}
                      size="sm"
                      variant="outline"
                      isDisabled={processingItems[item.id]}
                    />
                    <Text>{item.quantity}</Text>
                    <IconButton
                      aria-label="Incrementar"
                      icon={<AddIcon />}
                      onClick={() => handleQuantityChange(item, 'increment')}
                      size="sm"
                      variant="outline"
                      isDisabled={processingItems[item.id]}
                    />
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
            isDisabled={items.length === 0 || !selectedPaymentMethod || !fullName.trim() || isProcessing}
            leftIcon={<Icon as={FaWhatsapp} />}
            mb={2}
            isLoading={isProcessing}
          >
            {isProcessing ? "Procesando..." : "Enviar pedido por WhatsApp"}
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
    </Drawer>
  );
};

export default CartDrawer;