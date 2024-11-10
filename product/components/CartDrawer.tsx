import React, { useState } from 'react';
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
  Text,
  Flex,
  IconButton,
  Box,
  Stack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { CartItem } from '../types';
import { parseCurrency } from '../../utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onIncrement: (item: CartItem) => void;
  onDecrement: (item: CartItem) => void;
}

const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  items,
  onIncrement,
  onDecrement,
}) => {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const toast = useToast();

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const quantity = items.reduce((acc, item) => acc + item.quantity, 0);

  const isFullNameError = fullName.trim() === "";
  const isAddressError = address.trim() === "";
  const isPhoneError = phone.trim() === "";

  const handleSubmit = () => {
    if (isFullNameError || isAddressError || isPhoneError) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        status: "error",
        duration: 3000,
      });
      return;
    }

    const message = `¡Hola! Me gustaría hacer un pedido:
${items.map(item => `\n- ${item.title} (x${item.quantity}) - ${parseCurrency(item.price * item.quantity)}`).join('')}
\nTotal: ${parseCurrency(total)}

Datos de envío:
Nombre: ${fullName}
Dirección: ${address}
Teléfono: ${phone}`;

    window.open(`https://wa.me/TUNUMERO?text=${encodeURIComponent(message)}`);
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Tu Carrito</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            {items.map((item) => (
              <Box key={item.id} p={4} borderWidth="1px" borderRadius="lg">
                <Flex justify="space-between" align="center">
                  <Box flex="1">
                    <Text fontWeight="bold">{item.title}</Text>
                    <Text>{parseCurrency(item.price)}</Text>
                  </Box>
                  <Flex align="center" gap={2}>
                    <IconButton
                      aria-label="Decrease quantity"
                      icon={<MinusIcon />}
                      size="sm"
                      onClick={() => onDecrement(item)}
                    />
                    <Text>{item.quantity}</Text>
                    <IconButton
                      aria-label="Increase quantity"
                      icon={<AddIcon />}
                      size="sm"
                      onClick={() => onIncrement(item)}
                    />
                  </Flex>
                </Flex>
              </Box>
            ))}

            <FormControl isInvalid={isFullNameError} isRequired>
              <FormLabel>Nombre completo</FormLabel>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
              />
              {isFullNameError && (
                <FormErrorMessage>El nombre es requerido</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={isAddressError} isRequired>
              <FormLabel>Dirección</FormLabel>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Tu dirección de envío"
              />
              {isAddressError && (
                <FormErrorMessage>La dirección es requerida</FormErrorMessage>
              )}
            </FormControl>

            <FormControl isInvalid={isPhoneError} isRequired>
              <FormLabel>Teléfono</FormLabel>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Tu número de teléfono"
              />
              {isPhoneError && (
                <FormErrorMessage>El teléfono es requerido</FormErrorMessage>
              )}
            </FormControl>
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <VStack width="100%" spacing={4}>
            <Flex width="100%" justify="space-between">
              <Stack direction="row" spacing={3}>
                <Text>Ver carrito</Text>
                <Text
                  backgroundColor="rgba(0,0,0,0.25)"
                  borderRadius="sm"
                  color="gray.100"
                  fontSize="xs"
                  fontWeight="500"
                  paddingX={2}
                  paddingY={1}
                >
                  {quantity} {quantity === 1 ? "item" : "items"}
                </Text>
              </Stack>
              <Text fontWeight="bold">{parseCurrency(total)}</Text>
            </Flex>
            <Button
              colorScheme="whatsapp"
              width="100%"
              onClick={handleSubmit}
              isDisabled={items.length === 0}
            >
              Completar pedido por WhatsApp
            </Button>
          </VStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
