import React, { useState, useEffect } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import { getSiteInformation, updateSiteInformation, SiteInformation } from '../../utils/siteInfo';

const StoreConfiguration: React.FC = () => {
  const [storeInfo, setStoreInfo] = useState<SiteInformation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    const info = await getSiteInformation();
    setStoreInfo(info);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoreInfo(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type === 'logoUrl' ? 'logo' : 'banner');

    setIsLoading(true);
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error uploading image');
      }

      const data = await response.json();
      setStoreInfo(prev => prev ? { ...prev, [type]: data.url } : null);

      toast({
        title: 'Éxito',
        description: `La imagen se ha actualizado correctamente.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la imagen. Por favor, inténtalo de nuevo.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeInfo) return;

    setIsLoading(true);
    try {
      await updateSiteInformation(storeInfo);
      toast({
        title: 'Éxito',
        description: 'La información de la tienda se ha actualizado correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating store information:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la información de la tienda.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!storeInfo) return <Box>Cargando...</Box>;

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="md">Logo de la tienda</Heading>
        <Image src={storeInfo.logoUrl} alt="Logo" maxHeight="100px" />
        <FormControl>
          <FormLabel>Cambiar logo (Recomendado: 400x400 px)</FormLabel>
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
        </FormControl>

        <Heading as="h3" size="md">Banner de la tienda</Heading>
        <Image src={storeInfo.bannerUrl} alt="Banner" maxHeight="200px" />
        <FormControl>
          <FormLabel>Cambiar banner (Recomendado: 1920x400 px)</FormLabel>
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
        </FormControl>

        <FormControl>
          <FormLabel>Título de la tienda</FormLabel>
          <Input name="title" value={storeInfo.title} onChange={handleInputChange} />
        </FormControl>

        <FormControl>
          <FormLabel>Descripción principal</FormLabel>
          <Textarea name="description" value={storeInfo.description} onChange={handleInputChange} />
        </FormControl>

        <FormControl>
          <FormLabel>Descripción secundaria</FormLabel>
          <Textarea name="description2" value={storeInfo.description2} onChange={handleInputChange} />
        </FormControl>

        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;