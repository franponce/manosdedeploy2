import React, { useEffect, useState } from 'react';
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
  Image,
  Text,
  Flex,
  Container,
  Select,
  useToast,
} from '@chakra-ui/react';
import StoreConfiguration from '../product/components/StoreConfiguration';
import PaymentMethodsConfig from '../product/components/PaymentMethodsConfig';
import CustomScripts from '../product/components/CustomScripts';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaFlag } from 'react-icons/fa';
import { useSiteInfo } from '../hooks/useSiteInfo';
import { auth, updateSiteInfo } from '../utils/firebase';
import { currencies } from '@/utils/currencies';
import { parseCookies } from 'nookies';

const StoreConfigPage: React.FC = () => {
  const router = useRouter();
  const { siteInfo, mutate } = useSiteInfo();
  const [currency, setCurrency] = useState('ARS');
  const [isSubmittingCurrency, setIsSubmittingCurrency] = useState(false);
  const toast = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (siteInfo && siteInfo.currency) {
      setCurrency(siteInfo.currency);
    }
  }, [siteInfo]);

  useEffect(() => {
    const cookies = parseCookies();
    const authToken = cookies.authToken;

    if (authToken === 'admin-token') {
      setIsAdmin(true);
      setIsLoggedIn(true);
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setIsLoggedIn(true);
        } else {
          router.push('/login');
        }
      });

      return () => unsubscribe();
    }
  }, [router]);

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  const handleCurrencyChange = async () => {
    setIsSubmittingCurrency(true);
    try {
      await updateSiteInfo({ ...siteInfo, currency });
      mutate();
      toast({
        title: "Moneda actualizada",
        description: "La moneda de la tienda ha sido actualizada exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la moneda de la tienda.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingCurrency(false);
    }
  };

  const modifiedCurrencies = {
    ARS: { name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
    PEN: { name: 'Sol Peruano', symbol: 'S/', flag: '🇵🇪' },
    USD: { name: 'Dólar Estadounidense', symbol: '$', flag: '🇺🇸' },
    BRL: { name: 'Real Brasileño', symbol: 'R$', flag: '🇧🇷' },
    EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
    ...currencies
  };

  if (!siteInfo || !isLoggedIn) return null;

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
        </Flex>

        <Flex direction="column" alignItems="center" mb={8}>
          <Box
            backgroundColor="white"
            borderRadius="full"
            boxShadow="md"
            boxSize="120px"
            overflow="hidden"
            position="relative"
            mb={4}
          >
            <Image
              src={`${siteInfo?.logoUrl}?${new Date().getTime()}`}
              alt="Logo"
              objectFit="cover"
              width="100%"
              height="100%"
              fallback={<Box bg="gray.200" w="100%" h="100%" borderRadius="full" />}
            />
          </Box>
          <Text fontSize="xl" fontWeight="bold" mb={2}>E-commerce</Text>
          <Heading as="h1" size="2xl" textAlign="center">{siteInfo?.title}</Heading>
        </Flex>

        <Heading as="h2" size="xl" mb={8} textAlign="center">
          Configuración de la tienda
        </Heading>

        <VStack spacing={8} align="stretch">
          <Accordion allowMultiple>
            <AccordionItem>
              <h2>
                <AccordionButton>
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
                <AccordionButton>
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
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading as="h3" size="lg">
                      Moneda de la tienda
                    </Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Flex direction="column" align="stretch">
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    mb={4}
                  >
                    {Object.entries(modifiedCurrencies).map(([code, currency]) => {
                      if (typeof currency === 'object' && 'flag' in currency && 'name' in currency) {
                        return (
                          <option key={code} value={code}>
                            {currency.flag || <FaFlag />} {code} - {currency.name}
                          </option>
                        );
                      }
                      return null;
                    })}
                  </Select>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleCurrencyChange}
                    isLoading={isSubmittingCurrency}
                    loadingText="Guardando..."
                  >
                    Guardar cambios
                  </Button>
                </Flex>
              </AccordionPanel>
            </AccordionItem>

            {isAdmin && (
              <AccordionItem>
                <h2>
                  <AccordionButton>
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
            )}
          </Accordion>
        </VStack>
      </Container>
    </Box>
  );
};

export default StoreConfigPage;