import React from 'react';
import {
  Switch,
  FormControl,
  Tooltip,
  HStack,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { updateProductVisibility } from '../../utils/googleSheets';
import { mutate } from 'swr';
import { SWR_KEYS } from '../constants';

interface VisibilityToggleProps {
  isVisible: boolean;
  productId: string;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ 
  isVisible, 
  productId 
}) => {
  const toast = useToast();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      const response = await updateProductVisibility(productId, !isVisible);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await mutate(
        SWR_KEYS.PRODUCTS,
        async () => {
          const res = await fetch(SWR_KEYS.PRODUCTS);
          return res.json();
        },
        { revalidate: true }
      );
      
      toast({
        title: isVisible ? "Producto ocultado" : "Producto visible",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Error al cambiar visibilidad",
        description: "Por favor, intenta nuevamente",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <FormControl display="flex" alignItems="center">
      <HStack spacing={2}>
        <Tooltip label={isVisible ? 'Visible en la tienda' : 'Oculto en la tienda'}>
          <Icon 
            as={isVisible ? FaEye : FaEyeSlash} 
            color={isVisible ? 'green.500' : 'gray.500'}
          />
        </Tooltip>
        <Switch
          isChecked={isVisible}
          onChange={handleToggle}
          colorScheme="green"
          size="md"
          isDisabled={isUpdating}
        />
      </HStack>
    </FormControl>
  );
}; 