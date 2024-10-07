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
  Select,
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

interface PaymentMethods {
  mercadoPago: boolean;
  cashOnPickup: boolean;
  cashOnDelivery: boolean;
  bankTransfer: boolean;
}

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    mercadoPago: false,
    cashOnPickup: false,
    cashOnDelivery: false,
    bankTransfer: false,
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment-methods");
        if (!response.ok) throw new Error("Failed to fetch payment methods");
        const data = await response.json();
        setPaymentMethods(data);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      }
    };

    fetchPaymentMethods();
  }, []);

  const total = useMemo(
    () => parseCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0)),
    [items]
  );

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      if (selectedPaymentMethod === 'mercadoPago') {
        await handleMercadoPagoPayment();
      } else {
        handleWhatsAppRedirect(false, selectedPaymentMethod);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
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

  const handleWhatsAppRedirect = (isPaid: boolean = false, paymentMethod: string = '') => {
    const paymentInfo = isPaid 
      ? "\n\nEl pedido ya ha sido pagado a través de MercadoPago." 
      : `\n\nMétodo de pago seleccionado: ${paymentMethod}`;

    const whatsappMessage = encodeURIComponent(
      `¡Hola! Me gustaría realizar el siguiente pedido:\n${items
        .map(
          (item) =>
            `${item.title} (x${item.quantity}) - ${parseCurrency(
              item.price * item.quantity
            )}`
        )
        .join("\n")}\n\nTotal: ${total}${paymentInfo}`
    );
    const whatsappURL = `https://wa.me/${INFORMATION.whatsappCart}?text=${whatsappMessage}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay>
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Tu carrito</DrawerHeader>

          <DrawerBody>
            {/* ... (código existente para mostrar items) ... */}
          </DrawerBody>

          <DrawerFooter>
            <VStack spacing={4} width="100%">
              <Flex justify="space-between" width="100%">
                <Text fontWeight="bold">Total:</Text>
                <Text fontWeight="bold">{total}</Text>
              </Flex>
              {!isPaymentComplete && (
                <Select 
                  placeholder="Selecciona método de pago" 
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  isDisabled={items.length === 0}
                >
                  {paymentMethods.mercadoPago && <option value="mercadoPago">MercadoPago</option>}
                  {paymentMethods.cashOnPickup && <option value="cashOnPickup">Efectivo al retirar</option>}
                  {paymentMethods.cashOnDelivery && <option value="cashOnDelivery">Efectivo al recibir</option>}
                  {paymentMethods.bankTransfer && <option value="bankTransfer">Transferencia bancaria</option>}
                </Select>
              )}
              <Button
                colorScheme="blue"
                width="100%"
                onClick={handlePayment}
                isLoading={isProcessingPayment}
                loadingText="Procesando..."
                isDisabled={items.length === 0 || !selectedPaymentMethod}
              >
                Realizar pedido
              </Button>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;