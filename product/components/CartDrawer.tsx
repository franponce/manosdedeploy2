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
      `Método de pago: ${selectedPaymentMethod}\n` +
      `Aclaración: ${note.trim() || 'Sin aclaración'}\n` +
      `*Total: ${total} ${siteInfo?.currency}*`
    );
    const whatsappURL = `https://wa.me/${INFORMATION.whatsappCart}?text=${whatsappMessage}`;
    window.open(whatsappURL, "_blank");
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

  const handleIncrement = async (product: CartItem) => {
    try {
      const response = await fetch(`/api/products/${product.id}/stock`);
      const { stock } = await response.json();
      
      if (product.quantity >= stock) {
        toast({
          title: "Stock máximo alcanzado",
          description: `Solo hay ${stock} unidades disponibles`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      onIncrement(product);
    } catch (error) {
      console.error('Error verificando stock:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el stock disponible",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderStockInfo = (item: CartItem) => {
    return (
      <Text 
        fontSize="xs" 
        color={item.quantity >= item.stock ? "orange.500" : "green.500"}
      >
        {item.quantity >= item.stock 
          ? "Máximo stock alcanzado" 
          : `${item.stock - item.quantity} unidades disponibles`}
      </Text>
    );
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
                      {renderTitle(item)}
                      <Text fontSize="sm">{parseCurrency(item.price)} {siteInfo?.currency}</Text>
                      {renderStockInfo(item)}
                    </Box>
                    <HStack flexShrink={0}>
                      <Button size="sm" onClick={() => onDecrement(item)}>-</Button>
                      <Text>{item.quantity}</Text>
                      <Button 
                        size="sm" 
                        onClick={() => handleIncrement(item)}
                        isDisabled={item.quantity >= item.stock}
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
