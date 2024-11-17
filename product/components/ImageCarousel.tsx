import React from 'react';
import { Box, Image } from '@chakra-ui/react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  variant: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title }) => {
  if (!images || images.length === 0) return null;

  const mainImage = images[0].split('|||')[0].trim();

  return (
    <Box width="100%">
      <Image
        src={mainImage}
        alt={title}
        width="100%"
        height="auto"
        objectFit="contain"
      />
    </Box>
  );
};

export default ImageCarousel; 