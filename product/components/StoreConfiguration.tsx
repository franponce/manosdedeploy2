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
  Select,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
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

  useEffect(() => {
    if (siteInfo) {
      setLocalSiteInfo(siteInfo);
    }
  }, [siteInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalSiteInfo(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const url = await uploadImage(compressedFile, type === 'logoUrl' ? 'logo' : 'banner');
      setLocalSiteInfo(prev => prev ? { ...prev, [type]: url } : null);

      toast({
        title: "Imagen cargada",
        description: "La imagen se ha procesado y cargado correctamente.",
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
      await updateSiteInformation(localSiteInfo);
      await mutate(localSiteInfo);
      toast({
        title: "Configuración actualizada",
        description: "La información de la tienda se ha actualizado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
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

  if (isLoading) return <Box>Cargando...</Box>;
  if (isError) return <Box>Error al cargar la información de la tienda</Box>;
  if (!localSiteInfo) return null;

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading as="h3" size="md">Información de la tienda</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <FormControl mb={4}>
                <FormLabel>Nombre de la tienda</FormLabel>
                <Input name="title" value={localSiteInfo.title} onChange={handleInputChange} />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Descripción corta</FormLabel>
                <Textarea name="description" value={localSiteInfo.description} onChange={handleInputChange} />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Descripción larga</FormLabel>
                <Textarea name="description2" value={localSiteInfo.description2} onChange={handleInputChange} />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Logo</FormLabel>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                {localSiteInfo.logoUrl && <Image src={localSiteInfo.logoUrl} alt="Logo" maxWidth="200px" mt={2} />}
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Banner</FormLabel>
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
                {localSiteInfo.bannerUrl && <Image src={localSiteInfo.bannerUrl} alt="Banner" maxWidth="400px" mt={2} />}
              </FormControl>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading as="h3" size="md">Moneda de la tienda</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <FormControl>
                <FormLabel>Selecciona la moneda principal</FormLabel>
                <Select name="currency" value={localSiteInfo.currency} onChange={handleInputChange}>
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading as="h3" size="md">Configuración de métodos de pago</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {/* Aquí puedes agregar la configuración de métodos de pago */}
              <Text>Configuración de métodos de pago pendiente de implementar.</Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;
