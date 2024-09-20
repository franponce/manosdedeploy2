import React from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import StoreConfiguration from '../product/components/StoreConfiguration';
import ProtectedRoute from '../product/components/ProtectedRoute';

const StoreConfigPage: React.FC = () => {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <Box margin="auto" maxWidth="800px" padding={8}>
        <Heading as="h1" mb={8} size="xl">
          Configuración de la tienda
        </Heading>
        <VStack spacing={8} align="stretch">
          <StoreConfiguration />
        </VStack>
      </Box>
    </ProtectedRoute>
  );
};

export default StoreConfigPage;