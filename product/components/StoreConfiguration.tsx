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
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { SiteInformation, updateSiteInformation, uploadImage } from '../../utils/firebase';

const StoreConfiguration: React.FC = () => {
  const { siteInfo, mutate } = useSiteInfo();
  const [localSiteInfo, setLocalSiteInfo] = useState<SiteInformation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (siteInfo) {
      setLocalSiteInfo(siteInfo);
    }
  }, [siteInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalSiteInfo(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const url = await uploadImage(file, type === 'logoUrl' ? 'logo' : 'banner');
      setLocalSiteInfo(prev => prev ? { ...prev, [type]: url } : null);

      toast({
        title: 'Éxito',
        description: 'La imagen se ha cargado correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
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
    if (!localSiteInfo) return;

    setIsLoading(true);
    try {
      await updateSiteInformation(localSiteInfo);
      await mutate(localSiteInfo);
      toast({
        title: 'Éxito',
        description: 'La información de la tienda se ha actualizado correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating site information:', error);
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

  if (!localSiteInfo) return <Box>Cargando...</Box>;

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        {/* ... resto del código ... */}
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;