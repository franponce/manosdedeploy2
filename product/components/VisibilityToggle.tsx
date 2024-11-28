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

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      // Primero actualizamos Firebase
      await visibilityService.updateVisibility(productId, !initialIsVisible);
      
      // Luego actualizamos Google Sheets
      await updateProductVisibility(productId, !initialIsVisible);
      
      mutate(SWR_KEYS.PRODUCTS);
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
        <Tooltip label={initialIsVisible ? 'Visible en la tienda' : 'Oculto en la tienda'}>
          <Icon 
            as={initialIsVisible ? FaEye : FaEyeSlash} 
            color={initialIsVisible ? 'green.500' : 'gray.500'}
          />
        </Tooltip>
        <Switch
          isChecked={initialIsVisible}
          onChange={handleToggle}
          colorScheme="green"
          size="md"
          isDisabled={isUpdating}
        />
      </HStack>
    </FormControl>
  );
}; 