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
  IconButton,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { CartItem } from '../types';
import { parseCurrency } from '../../utils/currency';
import { INFORMATION } from '../../app/constants';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (product: CartItem) => void;
  onDecrement: (product: CartItem) => void;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
  const [isMercadoPagoEnabled, setIsMercadoPagoEnabled] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchMercadoPagoStatus = async () => {
      try {
        const response = await fetch("/api/mercadopago-status");
        if (!response.ok) throw new Error("Failed to fetch MercadoPago status");
        const data = await response.json();
        setIsMercadoPagoEnabled(data.enabled);
      } catch (error) {
        console.error("Error fetching MercadoPago status:", error);
        setIsMercadoPagoEnabled(false);
      }
    };

    fetchMercadoPagoStatus();
  }, []);

  const total = useMemo(
    () => parseCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0)),
    [items]
  );

  const handleMercadoPagoPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            title: item.title,
            unit_price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to create MercadoPago preference");

      const data = await response.json();
      window.location.href = data.init_point;
    } catch (error) {
      console.error("Error processing MercadoPago payment:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar el pago. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleWhatsAppRedirect = (isPaid: boolean = false) => {
    const whatsappMessage = encodeURIComponent(
      `¡Hola! Me gustaría realizar el siguiente pedido:\n${items
        .map(
          (item) =>
            `${item.title} (x${item.quantity}) - ${parseCurrency(
              item.price * item.quantity
            )}`
        )
        .join("\n")}\n\nTotal: ${total}${
        isPaid ? "\n\nEl pedido ya ha sido pagado a través de MercadoPago." : ""
      }`
    );
    const whatsappURL = `https://wa.me/${INFORMATION.whatsappCart}?text=${whatsappMessage}`;
    window.open(whatsappURL, "_blank");
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPaymentComplete) {
      timer = setTimeout(() => {
        window.location.reload();
      }, 120000); // 2 minutes
    }
    return () => clearTimeout(timer);
  }, [isPaymentComplete]);

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Tu carrito</DrawerHeader>

          <DrawerBody>
            <VStack spacing={4}>
              {items.map((item) => (
                <Flex key={item.id} w="100%" justify="space-between" align="center">
                  <Image src={item.image} alt={item.title} boxSize="50px" objectFit="cover" mr={2} />
                  <Box flex={1}>
                    <Text fontWeight="bold">{item.title}</Text>
                    <Text>{parseCurrency(item.price)}</Text>
                  </Box>
                  <HStack>
                    <IconButton
                      aria-label="Decrease quantity"
                      icon={<MinusIcon />}
                      onClick={() => onDecrement(item)}
                      isDisabled={isPaymentComplete}
                    />
                    <Text>{item.quantity}</Text>
                    <IconButton
                      aria-label="Increase quantity"
                      icon={<AddIcon />}
                      onClick={() => onIncrement(item)}
                      isDisabled={isPaymentComplete}
                    />
                  </HStack>
                </Flex>
              ))}
            </VStack>
          </DrawerBody>

          <DrawerFooter>
            <VStack spacing={4} width="100%">
              <Flex justify="space-between" width="100%">
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold">{total}</Text>
              </Flex>
              {!isPaymentComplete ? (
                <>
                  {isMercadoPagoEnabled && (
                    <Button
                      colorScheme="blue"
                      width="100%"
                      onClick={handleMercadoPagoPayment}
                      isLoading={isProcessingPayment}
                      loadingText="Procesando..."
                      isDisabled={items.length === 0}
                    >
                      Pagar ahora y generar pedido
                    </Button>
                  )}
                  <Button
                    colorScheme="green"
                    width="100%"
                    onClick={() => handleWhatsAppRedirect()}
                    isDisabled={items.length === 0}
                  >
                    Realizar pedido manual por WhatsApp
                  </Button>
                </>
              ) : (
                <Button
                  colorScheme="green"
                  width="100%"
                  onClick={() => handleWhatsAppRedirect(true)}
                >
                  Notificar pago y orden por WhatsApp
                </Button>
              )}
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;