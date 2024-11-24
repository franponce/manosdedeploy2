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

const CartDrawer: React.FC<Props> = ({ isOpen, onClose, items, onIncrement, onDecrement }) => {
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
                  src={item.images[0]}
                  alt={item.title}
                  width="80px"
                  height="80px"
                  objectFit="cover"
                  borderRadius="md"
                  fallbackSrc="/placeholder.png"
                />
                
                <VStack flex={1} align="flex-start" spacing={1}>
                  <Text fontWeight="bold">{item.title}</Text>
                  <Text color="gray.600">{parseCurrency(item.price)}</Text>
                </VStack>

                <HStack>
                  <IconButton
                    aria-label="Decrementar"
                    icon={<MinusIcon />}
                    onClick={() => onDecrement(item)}
                    size="sm"
                    variant="outline"
                  />
                  
                  <Text width="40px" textAlign="center">
                    {item.quantity}
                  </Text>
                  
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