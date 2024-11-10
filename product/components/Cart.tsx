import React from 'react';
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
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, DeleteIcon } from '@chakra-ui/icons';
import { CartItem } from '../types';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Tu Carrito</DrawerHeader>

        <DrawerBody>
          <VStack spacing={4} align="stretch">
            {items.length === 0 ? (
              <Text>Tu carrito está vacío</Text>
            ) : (
              items.map((item) => (
                <Box key={item.id} p={4} borderWidth="1px" borderRadius="lg">
                  <Flex justify="space-between" align="center">
                    <Box flex="1">
                      <Text fontWeight="bold">{item.title}</Text>
                      <Text>${item.price.toFixed(2)}</Text>
                    </Box>
                    <Flex align="center" gap={2}>
                      <IconButton
                        aria-label="Decrease quantity"
                        icon={<MinusIcon />}
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      />
                      <Text>{item.quantity}</Text>
                      <IconButton
                        aria-label="Increase quantity"
                        icon={<AddIcon />}
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      />
                      <IconButton
                        aria-label="Remove item"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => onRemoveItem(item.id)}
                      />
                    </Flex>
                  </Flex>
                </Box>
              ))
            )}
          </VStack>
        </DrawerBody>

        <DrawerFooter borderTopWidth="1px">
          <VStack width="100%" spacing={4}>
            <Flex width="100%" justify="space-between">
              <Text fontWeight="bold">Total:</Text>
              <Text fontWeight="bold">${total.toFixed(2)}</Text>
            </Flex>
            <Button
              colorScheme="blue"
              width="100%"
              isDisabled={items.length === 0}
            >
              Proceder al pago
            </Button>
          </VStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Cart; 