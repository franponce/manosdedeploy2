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
import { SiteInformation, updateSiteInfo, uploadImage } from '../../utils/firebase';
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

  useEffect(() => {
    if (siteInfo) {
      setLocalSiteInfo({
        ...siteInfo,
        description2: siteInfo.description2.replace(/<br>/g, '\n')
      });
    }
  }, [siteInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'title' && value.length > MAX_TITLE_LENGTH) {
      return;
    }
    if (name === 'description' && value.length > MAX_SUMMARY_LENGTH) {
      return;
    }
    if (name === 'description2' && value.length > MAX_DESCRIPTION_LENGTH) {
      return;
    }
    setLocalSiteInfo(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd } = textarea;
      const value = textarea.value;
      const newValue = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
      setLocalSiteInfo(prev => prev ? { ...prev, [textarea.name]: newValue } : null);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      }, 0);
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
      
      const url = await uploadImage(compressedFile, type === 'logoUrl' ? 'logo' : 'banner');
      setLocalSiteInfo(prev => prev ? { ...prev, [type]: url } : null);

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
        description: localSiteInfo.description,
        description2: localSiteInfo.description2.replace(/\n/g, '<br>')
      };
      await updateSiteInfo(updatedSiteInfo);
      await mutate(updatedSiteInfo);
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
        <Heading as="h3" size="md">Información de la tienda</Heading>
        <FormControl>
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

        <FormControl>
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

        <FormControl>
          <FormLabel>Descripción de la tienda</FormLabel>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Recomendaciones 😉:<br />
            • Ingresa información que creas importante que los clientes sepan antes de comprar, como tus horarios de atención, ubicación, envíos, etc.<br />
            • Puedes usar saltos de línea para organizar mejor tu texto.
          </Text>
          <Textarea 
            name="description2" 
            value={localSiteInfo.description2} 
            onChange={handleInputChange}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={6}
          />
          <Text fontSize="sm" color="gray.500" mt={1}>
            {localSiteInfo.description2.length}/{MAX_DESCRIPTION_LENGTH} caracteres
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Imagen de perfil</FormLabel>
          <Image src={localSiteInfo.logoUrl} alt="Logo" maxWidth="200px" maxHeight="100px" objectFit="contain" mb={2} />
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
          <Text fontSize="sm" color="gray.600" mt={2}>
            Recomendaciones 😉:<br />
            • Las medidas recomendadas son de 400x400 px.<br />
            • No debe pesar más de 5MB.
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Banner</FormLabel>
          <Image src={localSiteInfo.bannerUrl} alt="Banner" maxHeight="200px" mb={2} />
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
          <Text fontSize="sm" color="gray.600" mt={2}>
            Recomendaciones 😉:<br />
            • Es la primera imagen que verán los clientes<br />
            • Las medidas recomendadas son de 1920x400 px.<br />
            • No debe pesar más de 5MB.
          </Text>
        </FormControl>

        <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;
