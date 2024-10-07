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
  const toast = useToast();

  useEffect(() => {
    const storedMethods = localStorage.getItem('paymentMethods');
    if (storedMethods) {
      setPaymentMethods(JSON.parse(storedMethods));
    }
  }, [isOpen]); // Re-fetch when drawer opens

  const total = useMemo(
    () => parseCurrency(items.reduce((total, item) => total + item.price * item.quantity, 0)),
    [items]
  );

  const handleWhatsAppRedirect = () => {
    const paymentInfo = selectedPaymentMethod 
      ? `\n\nVoy a pagar con: ${selectedPaymentMethod}`
      : '';

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
                    />
                    <Text>{item.quantity}</Text>
                    <IconButton
                      aria-label="Increase quantity"
                      icon={<AddIcon />}
                      onClick={() => onIncrement(item)}
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
              <Select 
                placeholder="Selecciona método de pago" 
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                isDisabled={items.length === 0}
              >
                {paymentMethods.mercadoPago && <option value="MercadoPago">MercadoPago</option>}
                {paymentMethods.cashOnPickup && <option value="Efectivo al retirar">Efectivo al retirar</option>}
                {paymentMethods.cashOnDelivery && <option value="Efectivo al recibir">Efectivo al recibir</option>}
                {paymentMethods.bankTransfer && <option value="Transferencia bancaria">Transferencia bancaria</option>}
              </Select>
              <Button
                colorScheme="green"
                width="100%"
                onClick={handleWhatsAppRedirect}
                isDisabled={items.length === 0 || !selectedPaymentMethod}
              >
                Realizar pedido por WhatsApp
              </Button>
            </VStack>
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;