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
  const [siteInfo, setSiteInfo] = useState<SiteInformation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const SUBTITLE_MAX_LENGTH = 100;
  const DESCRIPTION_MAX_LENGTH = 500;

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const fetchStoreInfo = async () => {
    const info = await getSiteInformation();
    setSiteInfo(info);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteInfo) return;

    setIsLoading(true);
    try {
      await updateSiteInformation(siteInfo);
      toast({
        title: 'Información actualizada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error al actualizar',
        description: 'No se pudo actualizar la información de la tienda',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!siteInfo) return;

    if (name === 'subtitle') {
      setSiteInfo({ ...siteInfo, [name]: value.slice(0, SUBTITLE_MAX_LENGTH) });
    } else if (name === 'description') {
      const trimmedValue = value.replace(/\n/g, '').slice(0, DESCRIPTION_MAX_LENGTH);
      setSiteInfo({ ...siteInfo, [name]: value.slice(0, trimmedValue.length + (value.match(/\n/g) || []).length) });
    } else {
      setSiteInfo({ ...siteInfo, [name]: value });
    }
  };

  if (!siteInfo) return null;

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Título de la tienda</FormLabel>
          <Input
            name="title"
            value={siteInfo.title}
            onChange={handleInputChange}
            placeholder="Ingresa el título de tu tienda"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Subtítulo / Call to Action</FormLabel>
          <Input
            name="subtitle"
            value={siteInfo.subtitle}
            onChange={handleInputChange}
            placeholder="Ingresa un subtítulo o call to action"
            maxLength={SUBTITLE_MAX_LENGTH}
          />
          <Text fontSize="sm" textAlign="right">
            {siteInfo.subtitle.length}/{SUBTITLE_MAX_LENGTH}
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Descripción principal</FormLabel>
          <Textarea
            name="description"
            value={siteInfo.description}
            onChange={handleInputChange}
            placeholder="Ingresa la descripción principal de tu tienda"
            rows={5}
          />
          <Text fontSize="sm" textAlign="right">
            {siteInfo.description.replace(/\n/g, '').length}/{DESCRIPTION_MAX_LENGTH}
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Logo de la tienda</FormLabel>
          <Box
            borderWidth={1}
            borderRadius="md"
            overflow="hidden"
            width="100px"
            height="100px"
          >
            <Image
              src={siteInfo.logoUrl}
              alt="Logo de la tienda"
              objectFit="cover"
              width="100%"
              height="100%"
            />
          </Box>
          <Text mt={2} fontSize="sm">
            Para cambiar el logo, contacta al administrador del sistema.
          </Text>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Guardando..."
        >
          Guardar cambios
        </Button>
      </VStack>
    </form>
  );
};

export default StoreConfiguration;
