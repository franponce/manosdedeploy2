import React, { useState } from 'react';
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
import { visibilityService } from '../../utils/firebase';
import { useVisibility } from '../../hooks/useVisibility';

interface VisibilityToggleProps {
  isVisible: boolean;
  productId: string;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ 
  isVisible: initialIsVisible,
  productId 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();
  const { isVisible } = useVisibility(productId);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await visibilityService.updateVisibility(productId, !isVisible);
      
      // Mutate both the visibility state and the products list
      mutate(`/visibility/${productId}`);
      mutate(SWR_KEYS.PRODUCTS);
      
      toast({
        title: "Éxito",
        description: `Producto ${!isVisible ? 'visible' : 'oculto'} en la tienda`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la visibilidad del producto",
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