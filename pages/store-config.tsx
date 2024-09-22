import React from 'react';
import {
  Box,
  Heading,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
} from '@chakra-ui/react';
import StoreConfiguration from '../product/components/StoreConfiguration';
import MercadoPagoConfig from '../product/components/MercadoPagoConfig';
import CustomScripts from '../product/components/CustomScripts';
import { useRouter } from 'next/router';

const StoreConfigPage: React.FC = () => {
  const router = useRouter();

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  return (
    <Box margin="auto" maxWidth="800px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Configuración de la tienda
      </Heading>

      <Button colorScheme="gray" onClick={handleBackToAdmin} mb={8}>
        Volver a la gestión de productos
      </Button>

      <VStack spacing={8} align="stretch">
        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Información de la tienda
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <StoreConfiguration />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Configuración de MercadoPago
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <MercadoPagoConfig />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Scripts personalizados
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <CustomScripts />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};

export default StoreConfigPage;