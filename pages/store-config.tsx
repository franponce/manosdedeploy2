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
  Icon,
  Flex,
  Container,
} from '@chakra-ui/react';
import StoreConfiguration from '../product/components/StoreConfiguration';
import PaymentMethodsConfig from '../product/components/PaymentMethodsConfig';
import CustomScripts from '../product/components/CustomScripts';
import { useRouter } from 'next/router';
import { FaArrowLeft } from 'react-icons/fa';

const StoreConfigPage: React.FC = () => {
  const router = useRouter();

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  return (
    <Box>
      <Container maxW="container.xl" p={4}>
        <Flex justifyContent="space-between" alignItems="center" mb={8}>
          <Button
            leftIcon={<Icon as={FaArrowLeft} />}
            onClick={handleBackToAdmin}
            variant="outline"
          >
            Volver a la gestión de productos
          </Button>
          {/* Aquí iría el menú hamburguesa si lo tienes en este componente */}
        </Flex>

        <Heading as="h1" size="2xl" mb={12} textAlign="center">
          Configuración de la tienda
        </Heading>

        <VStack spacing={8} align="stretch">
          <Accordion allowMultiple>
            <AccordionItem border="none" mb={4}>
              <h2>
                <AccordionButton
                  bg="gray.100"
                  _hover={{ bg: 'gray.200' }}
                  _expanded={{ bg: 'gray.200' }}
                  borderRadius="full"
                  p={6}
                >
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
                      Información de la tienda
                    </Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pt={8} pb={4}>
                <StoreConfiguration />
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem border="none" mb={4}>
              <h2>
                <AccordionButton
                  bg="gray.100"
                  _hover={{ bg: 'gray.200' }}
                  _expanded={{ bg: 'gray.200' }}
                  borderRadius="full"
                  p={6}
                >
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
                      Configuración de métodos de pago
                    </Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pt={8} pb={4}>
                <PaymentMethodsConfig />
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem border="none">
              <h2>
                <AccordionButton
                  bg="gray.100"
                  _hover={{ bg: 'gray.200' }}
                  _expanded={{ bg: 'gray.200' }}
                  borderRadius="full"
                  p={6}
                >
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
                      Scripts personalizados
                    </Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pt={8} pb={4}>
                <CustomScripts />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Container>
    </Box>
  );
};

export default StoreConfigPage;