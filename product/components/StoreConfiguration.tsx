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
  Link,
} from '@chakra-ui/react';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { SiteInformation, updateSiteInformation, uploadImage } from '../../utils/firebase';
import PersistentTooltip from '../components/PersistentTooltip';

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
    setLocalSiteInfo(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'bannerUrl') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadImage(file, type === 'logoUrl' ? 'logo' : 'banner');
      setLocalSiteInfo(prev => prev ? { ...prev, [type]: url } : null);
      toast({
        title: "Imagen cargada",
        description: "La imagen se ha cargado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la imagen.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
              <FormLabel>Descripción principal</FormLabel>
              <Textarea name="description" value={localSiteInfo.description} onChange={handleInputChange} />
            </FormControl>

            <FormControl>
              <FormLabel>Descripción secundaria</FormLabel>
              <Textarea name="description2" value={localSiteInfo.description2} onChange={handleInputChange} />
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