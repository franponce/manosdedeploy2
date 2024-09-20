import React, { useState } from 'react';
import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Image,
  useToast,
} from '@chakra-ui/react';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { updateSiteInformation, uploadImage, SiteInformation } from '../../utils/siteInfo';

const StoreConfiguration: React.FC = () => {
  const { siteInfo, mutate } = useSiteInfo();
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (siteInfo) {
      mutate({ ...siteInfo, [name]: value }, false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file || !siteInfo) return;

    setIsLoading(true);
    try {
      const imageUrl = await uploadImage(file, type === 'logoUrl' ? 'logo' : 'banner');
      const updatedSiteInfo = { ...siteInfo, [type]: imageUrl };
      mutate(updatedSiteInfo, false);
      toast({
        title: 'Imagen cargada',
        description: 'La imagen se ha actualizado correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la imagen.',
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
    if (!siteInfo) return;

    setIsLoading(true);
    try {
      await updateSiteInformation(siteInfo);
      mutate(siteInfo);
      toast({
        title: 'Éxito',
        description: 'La información de la tienda se ha actualizado correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
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

  if (!siteInfo) return <Box>Cargando...</Box>;

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Título de la tienda</FormLabel>
          <Input name="title" value={siteInfo.title} onChange={handleInputChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Descripción principal</FormLabel>
          <Textarea name="description" value={siteInfo.description} onChange={handleInputChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Descripción secundaria</FormLabel>
          <Textarea name="description2" value={siteInfo.description2} onChange={handleInputChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Logo de la tienda</FormLabel>
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
          {siteInfo.logoUrl && <Image src={siteInfo.logoUrl} alt="Logo" maxHeight="100px" mt={2} />}
        </FormControl>
        <FormControl>
          <FormLabel>Banner de la tienda</FormLabel>
          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
          {siteInfo.bannerUrl && <Image src={siteInfo.bannerUrl} alt="Banner" maxHeight="200px" mt={2} />}
        </FormControl>
        <Button type="submit" colorScheme="blue" isLoading={isLoading}>
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;