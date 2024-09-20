import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  Image,
  Button,
  Text,
  useToast,
} from '@chakra-ui/react';

interface SiteImages {
  logoUrl: string;
  bannerUrl: string;
}

const DEFAULT_LOGO = '/default-logo.png';
const DEFAULT_BANNER = '/default-banner.jpg';

const SiteImageManagement: React.FC = () => {
  const [siteImages, setSiteImages] = useState<SiteImages>({
    logoUrl: DEFAULT_LOGO,
    bannerUrl: DEFAULT_BANNER,
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchSiteImages();
  }, []);

  const fetchSiteImages = async () => {
    try {
      const response = await fetch('/api/site-images');
      if (response.ok) {
        const data = await response.json();
        setSiteImages(data);
      }
    } catch (error) {
      console.error('Error fetching site images:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

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
      setSiteImages(prevState => ({
        ...prevState,
        [type === 'logo' ? 'logoUrl' : 'bannerUrl']: data.url
      }));

      toast({
        title: 'Éxito',
        description: `La imagen de ${type === 'logo' ? 'logo' : 'banner'} se ha actualizado correctamente.`,
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

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>
        Gestión de imágenes del sitio
      </Heading>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h3" size="md" mb={2}>
            Logo (Recomendado: 400x400 px)
          </Heading>
          <Box position="relative" width="fit-content">
            <Image
              src={siteImages.logoUrl || DEFAULT_LOGO}
              alt="Logo"
              maxWidth="400px"
              maxHeight="400px"
            />
            <Button
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              opacity={0}
              _hover={{ opacity: 1 }}
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {siteImages.logoUrl === DEFAULT_LOGO ? 'Subir imagen' : 'Modificar imagen'}
            </Button>
          </Box>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'logo')}
            style={{ display: 'none' }}
          />
        </Box>
        <Box>
          <Heading as="h3" size="md" mb={2}>
            Banner (Recomendado: 1920x400 px)
          </Heading>
          <Box position="relative" width="fit-content">
            <Image
              src={siteImages.bannerUrl || DEFAULT_BANNER}
              alt="Banner"
              maxWidth="100%"
              maxHeight="400px"
            />
            <Button
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              opacity={0}
              _hover={{ opacity: 1 }}
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              {siteImages.bannerUrl === DEFAULT_BANNER ? 'Subir imagen' : 'Modificar imagen'}
            </Button>
          </Box>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'banner')}
            style={{ display: 'none' }}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default SiteImageManagement;