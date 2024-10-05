import React from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  Icon,
  useToast,
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import { useRouter } from 'next/router';
import { FaArrowRight } from 'react-icons/fa';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  return (
    <Box margin="auto" maxWidth="1200px" padding={4}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ base: "stretch", md: "center" }}
        mb={8}
        gap={4}
      >
        <Heading as="h1" size="xl" mb={{ base: 4, md: 0 }}>
          Gestión de productos
        </Heading>
        <Flex
          direction={{ base: "column", sm: "row" }}
          gap={4}
        >
          <Button
            colorScheme="gray"
            onClick={handleStoreSettings}
            width={{ base: "full", sm: "auto" }}
            rightIcon={<Icon as={FaArrowRight} />}
          >
            Ir a la configuración de la tienda
          </Button>
        </Flex>
      </Flex>

      <ProductManagement />
    </Box>
  );
};

export default AdminPage;