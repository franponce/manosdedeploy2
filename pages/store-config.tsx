import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import StoreConfiguration from '../product/components/StoreConfiguration';

const StoreConfigPage: React.FC = () => {
  return (
    <Box margin="auto" maxWidth="800px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Información de la tienda
      </Heading>
      <StoreConfiguration />
    </Box>
  );
};

export default StoreConfigPage;