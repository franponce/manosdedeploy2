import React from 'react';
import { Flex, Text, Button, Icon, Box } from '@chakra-ui/react';
import { FaEye, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/router';

const PreviewBanner: React.FC = () => {
  const router = useRouter();

  const handleClose = () => {
    router.push('/admin');
  };

  return (
    <Box bg="blue.500" color="white" py={2}>
      <Flex 
        justifyContent="space-between" 
        alignItems="center" 
        maxWidth="container.xl" 
        mx="auto"
        px={4}
      >
        <Flex alignItems="center">
          <Icon as={FaEye} mr={2} />
          <Text>Estás en Modo Previsualización. Así ven los clientes tu tienda actualmente.</Text>
        </Flex>
        <Button 
          leftIcon={<Icon as={FaTimes} />} 
          variant="outline" 
          colorScheme="whiteAlpha" 
          size="sm"
          onClick={handleClose}
        >
          Cerrar y volver a editar la tienda
        </Button>
      </Flex>
    </Box>
  );
};

export default PreviewBanner;
