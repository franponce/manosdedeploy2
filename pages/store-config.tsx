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
import HamburgerMenu from '../product/components/HamburgerMenu';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../utils/firebase'; // Asegúrate de tener esta función implementada

const StoreConfigPage: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Asumimos que si el usuario está en esta página, es admin
  const isAdmin = true;

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
          <HamburgerMenu 
            isLoggedIn={isLoggedIn} 
            isAdmin={isAdmin} 
            onLogout={handleLogout}
          />
        </Flex>

        <Heading as="h1" size="2xl" mb={12} textAlign="center">
          Configuración de la tienda
        </Heading>

        <VStack spacing={8} align="stretch">
          <Accordion allowMultiple>
            <AccordionItem>
              <h2>
                <AccordionButton
                  _expanded={{ bg: 'gray.100', borderRadius: 'md' }}
                  borderRadius="md"
                  p={4}
                >
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
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
                <AccordionButton
                  _expanded={{ bg: 'gray.100', borderRadius: 'md' }}
                  borderRadius="md"
                  p={4}
                >
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
                      Configuración de métodos de pago
                    </Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <PaymentMethodsConfig />
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton
                  _expanded={{ bg: 'gray.100', borderRadius: 'md' }}
                  borderRadius="md"
                  p={4}
                >
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
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
      </Container>
    </Box>
  );
};

export default StoreConfigPage;