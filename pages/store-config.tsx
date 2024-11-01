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
  FormControl,
  FormLabel,
  Stack,
  Checkbox,
  Spinner,
  HStack,
} from '@chakra-ui/react';
import StoreConfiguration from '../product/components/StoreConfiguration';
import PaymentMethodsConfig from '../product/components/PaymentMethodsConfig';
import CustomScripts from '../product/components/CustomScripts';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaFlag } from 'react-icons/fa';
import { useSiteInfo } from '../hooks/useSiteInfo';
import { auth, updateSiteInfo, updateStoreConfig, getStoreConfig } from '../utils/firebase';
import { currencies } from '@/utils/currencies';
import { parseCookies } from 'nookies';

const StoreConfig: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para la visibilidad
  const [showHeaderInProduct, setShowHeaderInProduct] = useState(false);
  const [showLogoInProduct, setShowLogoInProduct] = useState(false);
  const [showDescriptionInProduct, setShowDescriptionInProduct] = useState(false);
  const [showSocialInProduct, setShowSocialInProduct] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const cookies = parseCookies();
      const authToken = cookies.authToken;

      if (authToken !== 'admin-token') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      
      // Cargar configuración actual
      try {
        const config = await getStoreConfig();
        setShowHeaderInProduct(config.visibility?.showHeaderInProduct ?? false);
        setShowLogoInProduct(config.visibility?.showLogoInProduct ?? false);
        setShowDescriptionInProduct(config.visibility?.showDescriptionInProduct ?? false);
        setShowSocialInProduct(config.visibility?.showSocialInProduct ?? false);
      } catch (error) {
        console.error('Error loading config:', error);
        toast({
          title: 'Error al cargar la configuración',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, toast]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await updateStoreConfig({
        visibility: {
          showHeaderInProduct,
          showLogoInProduct,
          showDescriptionInProduct,
          showSocialInProduct,
        },
      });
      
      toast({
        title: 'Configuración guardada',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error al guardar la configuración',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Configuración de la tienda</Heading>
        
        <Box>
          <Heading size="md" mb={4}>Visibilidad de elementos</Heading>
          <FormControl>
            <FormLabel>Elementos en página de producto</FormLabel>
            <Stack spacing={2}>
              <Checkbox 
                isChecked={showHeaderInProduct}
                onChange={(e) => setShowHeaderInProduct(e.target.checked)}
              >
                Mostrar banner en productos
              </Checkbox>
              <Checkbox 
                isChecked={showLogoInProduct}
                onChange={(e) => setShowLogoInProduct(e.target.checked)}
              >
                Mostrar logo en productos
              </Checkbox>
              <Checkbox 
                isChecked={showDescriptionInProduct}
                onChange={(e) => setShowDescriptionInProduct(e.target.checked)}
              >
                Mostrar descripción en productos
              </Checkbox>
              <Checkbox 
                isChecked={showSocialInProduct}
                onChange={(e) => setShowSocialInProduct(e.target.checked)}
              >
                Mostrar redes sociales en productos
              </Checkbox>
            </Stack>
          </FormControl>
        </Box>

        <HStack spacing={4} justify="flex-end">
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin')}
          >
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSaveConfig}
            isLoading={isSaving}
          >
            Guardar cambios
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default StoreConfig;