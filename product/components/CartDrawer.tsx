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
} from '@chakra-ui/react';
import { CartItem } from '../types';
import { parseCurrency } from '../../utils/currency';
import { INFORMATION } from '../../app/constants';
import { getPaymentMethods, PaymentMethods } from '../../utils/firebase';
import { FaShoppingCart } from 'react-icons/fa';

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
  const toast = useToast();

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
    const paymentInfo = selectedPaymentMethod 
      ? `\n\nVoy a pagar con: ${selectedPaymentMethod}`
      : '';

    const noteInfo = note.trim()
      ? `\n\nAclaración: ${note.trim()}`
      : '\n\nAclaración: Sin aclaración';

    const whatsappMessage = encodeURIComponent(
      `¡Hola! Me gustaría realizar el siguiente pedido:\n${items
        .map(
          (item) =>
            `${item.title} (x${item.quantity}) - ${parseCurrency(
              item.price * item.quantity
            )}`
        )
        .join("\n")}\n\nTotal: ${total}${paymentInfo}${noteInfo}`
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

          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {items.map((item) => (
                <Flex key={item.id} justify="space-between" align="center">
                  <Image src={item.image} alt={item.title} boxSize="50px" objectFit="cover" mr={2} />
                  <Box flex={1}>
                    <Text fontWeight="bold">{item.title}</Text>
                    <Text>{parseCurrency(item.price)}</Text>
                  </Box>
                  <HStack>
                    <Button size="sm" onClick={() => onDecrement(item)}>-</Button>
                    <Text>{item.quantity}</Text>
                    <Button size="sm" onClick={() => onIncrement(item)}>+</Button>
                  </HStack>
                </Flex>
              ))}

              <Box mt={6}>
                <Text fontWeight="bold" mb={2}>¿Cómo vas a abonar tu pedido?</Text>
                <RadioGroup onChange={setSelectedPaymentMethod} value={selectedPaymentMethod}>
                  <VStack align="start">
                    {paymentMethods.mercadoPago && <Radio value="MercadoPago">MercadoPago</Radio>}
                    {paymentMethods.cash && <Radio value="Efectivo">Efectivo</Radio>}
                    {paymentMethods.bankTransfer && <Radio value="Transferencia bancaria">Transferencia bancaria</Radio>}
                  </VStack>
                </RadioGroup>
              </Box>

              <Box mt={4}>
                <Text fontWeight="bold" mb={2}>¿Tienes alguna aclaración para el vendedor?</Text>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe tu mensaje aquí (máximo 180 caracteres)"
                  maxLength={180}
                />
                <Text fontSize="sm" textAlign="right">{note.length}/180</Text>
              </Box>
            </VStack>
          </DrawerBody>

          <DrawerFooter flexDirection="column">
            <Divider mb={4} />
            <Flex justify="space-between" width="100%" mb={4}>
              <Text fontWeight="bold">Total:</Text>
              <Text fontWeight="bold">{total} ARS</Text>
            </Flex>
            <Button
              colorScheme="green"
              width="100%"
              onClick={handleWhatsAppRedirect}
              isDisabled={items.length === 0 || !selectedPaymentMethod}
            >
              Realizar pedido por WhatsApp
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </DrawerOverlay>
    </Drawer>
  );
};

export default CartDrawer;