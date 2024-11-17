import React from 'react';
import { Box, Image, Grid } from '@chakra-ui/react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  variant: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title }) => {
  // Procesar las imágenes de forma simple
  const processedImages = images
    .filter(Boolean)
    .map(url => url.split('|||')[0].trim());

  return (
    <Grid 
      templateColumns={processedImages.length > 1 ? 'repeat(2, 1fr)' : '1fr'}
      gap={2}
      width="100%"
    >
      {processedImages.map((imageUrl, index) => (
        <Box 
          key={index}
          position="relative"
          paddingBottom="100%"
        >
          <Image
            src={imageUrl}
            alt={`${title} - Imagen ${index + 1}`}
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            objectFit="contain"
          />
        </Box>
      ))}
    </Grid>
  );
};

export default ImageCarousel; 