import React from "react";
import { Box, Heading, VStack } from "@chakra-ui/react";
import MercadoPagoConfig from "../components/MercadoPagoConfig";
import ProductManagement from "../components/ProductManagement";
import CustomScripts from "../components/CustomScripts";

const AdminPage: React.FC = () => {
  return (
    <Box margin="auto" maxWidth="1200px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Panel de administración
      </Heading>

      <VStack spacing={8} align="stretch">
        <MercadoPagoConfig />
        <ProductManagement />
        <CustomScripts />
      </VStack>
    </Box>
  );
};

export default AdminPage;