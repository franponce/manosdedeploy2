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
      await updateProductVisibility(productId, !isVisible);
      // Revalidar los datos inmediatamente
      await mutate(SWR_KEYS.PRODUCTS);
      
      toast({
        title: "Visibilidad actualizada",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error al actualizar visibilidad",
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