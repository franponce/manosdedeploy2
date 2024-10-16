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
  useToast,
  Link,
  Text,
  FormHelperText,
} from '@chakra-ui/react';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { SiteInformation, updateSiteInformation, uploadImage } from '../../utils/firebase';
import PersistentTooltip from '../components/PersistentTooltip';
import imageCompression from "browser-image-compression";

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    // Aplicar límites de caracteres
    if (name === 'title' && value.length > 50) {
      newValue = value.slice(0, 50);
    } else if (name === 'subtitle' && value.length > 100) {
      newValue = value.slice(0, 100);
    } else if (name === 'description' && value.length > 500) {
      newValue = value.slice(0, 500);
    }

    setLocalSiteInfo(prev => prev ? { ...prev, [name]: newValue } : null);
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
        <PersistentTooltip 
          label={
            <span>
              Sacale todo el provecho a tu banner siguiendo estos{' '}
              <Link href="https://tudominio.com/faqs#banner-tips" color="blue.600" isExternal>
                tips
              </Link>
            </span>
          }
          duration={7000}
        >
          <Box>
            <Heading as="h3" size="md">Banner de la tienda</Heading>
            <Text fontSize="sm" color="gray.600" mb={2}>Recomendado: 1920x400 px, máx 5MB</Text>
            <Image src={localSiteInfo.bannerUrl} alt="Banner" maxHeight="200px" />
            <FormControl>
              <FormLabel>Cambiar banner</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerUrl')} />
            </FormControl>
          </Box>
        </PersistentTooltip>

        <PersistentTooltip 
          label={
            <span>
              Optimiza tu logo con estos{' '}
              <Link href="https://tudominio.com/faqs#logo-tips" color="blue.600" isExternal>
                consejos
              </Link>
            </span>
          }
          duration={7000}
        >
          <Box>
            <Heading as="h3" size="md">Logo de la tienda</Heading>
            <Text fontSize="sm" color="gray.600" mb={2}>Recomendado: 400x400 px, máx 5MB</Text>
            <Image src={localSiteInfo.logoUrl} alt="Logo" maxWidth="200px" maxHeight="100px" objectFit="contain" />
            <FormControl>
              <FormLabel>Cambiar logo</FormLabel>
              <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
            </FormControl>
          </Box>
        </PersistentTooltip>

        <PersistentTooltip 
          label={
            <span>
              Mejora la información de tu tienda con estas{' '}
              <Link href="https://tudominio.com/faqs#store-info-tips" color="blue.600" isExternal>
                recomendaciones
              </Link>
            </span>
          }
          duration={7000}
        >
          <Box>
            <Heading as="h3" size="md">Información de la tienda</Heading>
            <FormControl>
              <FormLabel>Título de la tienda</FormLabel>
              <Input 
                name="title" 
                value={localSiteInfo.title} 
                onChange={handleInputChange} 
                maxLength={50}
              />
              <FormHelperText>{localSiteInfo.title.length}/50 caracteres</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Subtítulo / Call to Action</FormLabel>
              <Textarea 
                name="subtitle" 
                value={localSiteInfo.subtitle} 
                onChange={handleInputChange}
                maxLength={100}
              />
              <FormHelperText>{localSiteInfo.subtitle.length}/100 caracteres</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Descripción principal</FormLabel>
              <Textarea 
                name="description" 
                value={localSiteInfo.description} 
                onChange={handleInputChange}
                maxLength={500}
              />
              <FormHelperText>{localSiteInfo.description.length}/500 caracteres</FormHelperText>
            </FormControl>
          </Box>
        </PersistentTooltip>

        <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default StoreConfiguration;
