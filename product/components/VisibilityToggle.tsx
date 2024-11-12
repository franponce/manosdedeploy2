import React from 'react';
import {
  Switch,
  FormControl,
  Tooltip,
  HStack,
  Icon
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface VisibilityToggleProps {
  isVisible: boolean;
  onChange: () => void;
}

export const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ 
  isVisible, 
  onChange 
}) => {
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
          onChange={onChange}
          colorScheme="green"
          size="md"
        />
      </HStack>
    </FormControl>
  );
}; 