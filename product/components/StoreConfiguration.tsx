import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Image,
  Text,
  useToast,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
} from '@chakra-ui/react';
import { useSiteInfo } from '@/hooks/useSiteInfo';
import { SiteInformation, updateSiteInformation, uploadImage } from '../../utils/firebase';
import imageCompression from 'browser-image-compression';
import { currencies } from '@/utils/currencies';

const StoreConfiguration: React.FC = () => {
  const { siteInfo, isLoading, isError, mutate } = useSiteInfo();
  const [localSiteInfo, setLocalSiteInfo] = useState<SiteInformation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const MAX_TITLE_LENGTH = 50;
  const MAX_SUMMARY_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500;

  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  const [storeCurrency, setStoreCurrency] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (siteInfo) {
      setLocalSiteInfo(siteInfo);
      setExchangeRates(siteInfo.exchangeRates || {});
      setStoreCurrency(siteInfo.currency || '');
    }
  }, [siteInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > MAX_TITLE_LENGTH) {
      return; // No actualizar si excede el límite
    }
    if (name === 'description' && value.length > MAX_SUMMARY_LENGTH) {
      return; // No actualizar si excede el límite
    }
    if (name === 'description2' && value.length > MAX_DESCRIPTION_LENGTH) {
      return; // No actualizar si excede el límite
    }
    setLocalSiteInfo((prev: SiteInformation | null) => prev ? { ...prev, [name]: value } : null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd } = textarea;
      const value = textarea.value;
      const newValue = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
      setLocalSiteInfo((prev: SiteInformation | null) => prev ? { ...prev, [textarea.name]: newValue } : null);
      // Establecer la posición del cursor después del salto de línea
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      }, 0);
    }
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setStoreCurrency(event.target.value);
    setIsEditing(true);
  };

  const handleExchangeRateChange = (currency: string, value: number) => {
    setExchangeRates(prev => ({ ...prev, [currency]: value }));
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/ARS');
      const data = await response.json();
      const newRates: {[key: string]: number} = {};
      Object.entries(data.rates).forEach(([code, rate]) => {
        if (code !== 'ARS') {
          newRates[code] = 1 / Number(rate);
        }
      });
      setExchangeRates(newRates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      toast({
        title: "Error",
        description: "No se pudieron obtener las tasas de cambio actualizadas.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const img = await createImageBitmap(file);
      
      const options = {
        maxSizeMB: 5,
        maxWidthOrHeight: type === 'logoUrl' ? 400 : 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let newWidth = img.width;
      let newHeight = img.height;
      const targetWidth = type === 'logoUrl' ? 400 : 1920;
      const targetHeight = type === 'logoUrl' ? 400 : 400;

      if (newWidth > targetWidth || newHeight > targetHeight) {
        const ratio = Math.min(targetWidth / newWidth, targetHeight / newHeight);
        newWidth *= ratio;
        newHeight *= ratio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      
      const url = await uploadImage(base64, type === 'logoUrl' ? 'logo' : 'banner');
      setLocalSiteInfo((prev: SiteInformation | null) => prev ? { ...prev, [type]: url } : null);

      toast({
        title: "Imagen cargada",
        description: "La imagen se ha procesado y optimizado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSiteInfo) return;

    setIsSubmitting(true);
    try {
      const updatedSiteInfo = {
        ...localSiteInfo,
        description: localSiteInfo.description.replace(/\n/g, '<br>'),
        description2: localSiteInfo.description2.replace(/\n/g, '<br>'),
        exchangeRates,
        currency: storeCurrency,
      };
      await updateSiteInformation(updatedSiteInfo);
      await mutate(updatedSiteInfo);
      toast({
        title: "Configuración actualizada",
        description: "La información de la tienda se ha actualizado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating site information:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información de la tienda.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Aquí deberías implementar la lógica para guardar los cambios
      // Por ejemplo, una llamada a la API para actualizar la moneda de la tienda
      // await updateStoreCurrency(storeCurrency);
      setIsEditing(false);
      // Mostrar mensaje de éxito
    } catch (error) {
      // Manejar error
      console.error('Error al guardar los cambios:', error);
    }
  };

  if (isLoading) return <Box>Cargando...</Box>;
  if (isError) return <Box>Error al cargar la información de la tienda</Box>;
  if (!localSiteInfo) return null;

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h3" size="md" mb={4}>Información de la tienda</Heading>
          <FormControl mb={4}>
            <FormLabel>Nombre</FormLabel>
            <Input 
              name="title" 
              value={localSiteInfo.title} 
              onChange={handleInputChange}
              maxLength={MAX_TITLE_LENGTH}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              {localSiteInfo.title.length}/{MAX_TITLE_LENGTH} caracteres
            </Text>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Resumen de la tienda</FormLabel>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Recomendaciones 😉:<br />
              • Cuéntale a tus clientes en una breve oración de qué trata tu tienda. También puedes usar un call to action o slogan.
            </Text>
            <Textarea 
              name="description" 
              value={localSiteInfo.description} 
              onChange={handleInputChange}
              maxLength={MAX_SUMMARY_LENGTH}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              {localSiteInfo.description.length}/{MAX_SUMMARY_LENGTH} caracteres
            </Text>
          </FormControl>

          <FormControl mb={4}>
            <FormLabel>Descripción de la tienda</FormLabel>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Recomendaciones 😉:<br />
              • Ingresa información que creas importante que los clientes sepan antes de comprar, como tus horarios de atención, ubicación, envíos, etc.
            </Text>
            <Textarea 
              name="description2" 
              value={localSiteInfo.description2} 
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              {localSiteInfo.description2.length}/{MAX_DESCRIPTION_LENGTH} caracteres
            </Text>
          </FormControl>
        </Box>

        <Divider my={6} />

        <FormControl>
          <FormLabel>Moneda de la tienda</FormLabel>
          <Select value={storeCurrency} onChange={handleCurrencyChange}>
            <option value="USD">USD - Dólar estadounidense</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - Libra esterlina</option>
            {/* Añade más opciones de moneda según sea necesario */}
          </Select>
        </FormControl>

        {isEditing && (
          <Button mt={4} colorScheme="blue" onClick={handleSaveChanges}>
            Guardar cambios
          </Button>
        )}

        <Box>
          <Heading as="h4" size="md" mb={2}>Tasas de cambio</Heading>
          <Button onClick={fetchExchangeRates} mb={4}>Actualizar tasas de cambio</Button>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Moneda</Th>
                <Th>Tasa de cambio (respecto a {storeCurrency})</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currencies.map((currency) => (
                currency.code !== storeCurrency && (
                  <Tr key={currency.code}>
                    <Td>{currency.symbol} {currency.code}</Td>
                    <Td>
                      <NumberInput
                        value={exchangeRates[currency.code] || 0}
                        onChange={(_, value) => handleExchangeRateChange(currency.code, value)}
                        min={0}
                        step={0.0001}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Td>
                  </Tr>
                )
              ))}
            </Tbody>
          </Table>
        </Box>

        <Divider my={6} />

        <Box>
          <Heading as="h3" size="md" mb={4}>Imágenes de la tienda</Heading>
          
          <Box mb={6}>
            <Heading as="h4" size="sm" mb={2}>Imagen de perfil</Heading>
            <Image src={localSiteInfo.logoUrl} alt="Logo" maxWidth="200px" maxHeight="100px" objectFit="contain" mb={2} />
            <FormControl>
              <FormLabel>Cambiar logo</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
            </FormControl>
            <Text fontSize="sm" color="gray.600" mt={2}>
              Recomendaciones 😉:<br />
              • Las medidas recomendadas son de 400x400 px.<br />
              • No debe pesar más de 5MB.
            </Text>
          </Box>

          <Box mb={6}>
            <Heading as="h4" size="sm" mb={2}>Banner</Heading>
            <Image src={localSiteInfo.bannerUrl} alt="Banner" maxHeight="200px" mb={2} />
            <FormControl>
              <FormLabel>Cambiar banner</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
            </FormControl>
            <Text fontSize="sm" color="gray.600" mt={2}>
              Recomendaciones 😉:<br />
              • Es la primera imagen que verán los clientes<br />
              • Las medidas recomendadas son de 1920x400 px.<br />
              • No debe pesar más de 5MB.
            </Text>
          </Box>
        </Box>

        <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;
