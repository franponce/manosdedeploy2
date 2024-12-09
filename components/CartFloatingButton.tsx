import React from 'react';
import {
  Button,
  Stack,
  Text,
  Flex,
} from '@chakra-ui/react';
import { useCart } from '../hooks/useCart';
import { parseCurrency } from '../utils/currency';
import { CartItem } from '../product/types';

interface CartFloatingButtonProps {
  onOpen: () => void;
}

const CartFloatingButton: React.FC<CartFloatingButtonProps> = ({ onOpen }) => {
  const { cart } = useCart();

  if (!cart.length) return null;

  const total = parseCurrency(
    cart.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0)
  );

  const quantity = cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);

  return (
    <Flex 
      position="fixed" 
      bottom={4} 
      width="100%" 
      justifyContent="center" 
      zIndex={1000}
    >
      <Button
        boxShadow="xl"
        colorScheme="blue"
        size="lg"
        width={{ base: "90%", sm: "fit-content" }}
        onClick={onOpen}
      >
        <Stack alignItems="center" direction="row" spacing={6}>
          <Stack alignItems="center" direction="row" spacing={3}>
            <Text fontSize="md" lineHeight={6}>
              Ver carrito
            </Text>
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
          <Text fontSize="md" lineHeight={6}>
            {total}
          </Text>
        </Stack>
      </Button>
    </Flex>
  );
};

export default CartFloatingButton; 