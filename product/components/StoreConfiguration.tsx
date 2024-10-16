import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Textarea,
  Text,
  Image,
  Box,
} from '@chakra-ui/react';
import { updateSiteInformation, getSiteInformation, SiteInformation } from '../../utils/firebase';

const StoreConfiguration: React.FC = () => {
  const { siteInfo, isLoading, isError, mutate } = useSiteInfo();
  const [localSiteInfo, setLocalSiteInfo] = useState<SiteInformation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const SUBTITLE_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  useEffect(() => {
    if (siteInfo) {
      setLocalSiteInfo(siteInfo);
    }
  }, [siteInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!localSiteInfo) return;

    if (name === 'subtitle') {
      setLocalSiteInfo({ ...localSiteInfo, [name]: value.slice(0, SUBTITLE_MAX_LENGTH) });
    } else if (name === 'description') {
      const trimmedValue = value.replace(/\n/g, '').slice(0, DESCRIPTION_MAX_LENGTH);
      setLocalSiteInfo({ ...localSiteInfo, [name]: value.slice(0, trimmedValue.length + (value.match(/\n/g) || []).length) });
    } else {
      setLocalSiteInfo({ ...localSiteInfo, [name]: value });
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
              <Input name="title" value={localSiteInfo.title} onChange={handleInputChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Subtítulo / Call to Action</FormLabel>
              <Input 
                name="subtitle" 
                value={localSiteInfo.subtitle} 
                onChange={handleInputChange}
                maxLength={SUBTITLE_MAX_LENGTH}
              />
              <Text fontSize="sm" textAlign="right">
                {localSiteInfo.subtitle.length}/{SUBTITLE_MAX_LENGTH}
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Descripción principal</FormLabel>
              <Textarea 
                name="description" 
                value={localSiteInfo.description} 
                onChange={handleInputChange}
              />
              <Text fontSize="sm" textAlign="right">
                {localSiteInfo.description.replace(/\n/g, '').length}/{DESCRIPTION_MAX_LENGTH}
              </Text>
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

