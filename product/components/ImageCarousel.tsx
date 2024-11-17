import React from 'react';
import { Box, Flex, Image } from '@chakra-ui/react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  variant: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title, variant }) => {
  if (!images || images.length === 0) return null;

  const processedImages = images
    .filter(Boolean)
    .map(url => url.split('|||')[0].trim());

  const imageSize = variant === 'product' ? "400px" : "200px";

  return (
    <Box 
      width="100%" 
      overflow="hidden"
    >
      <Flex gap={2}>
        {processedImages.map((imageUrl, index) => (
          <Box 
            key={index}
            minWidth={imageSize}
            height={imageSize}
          >
            <Image
              src={imageUrl}
              alt={`${title} - Imagen ${index + 1}`}
              width="100%"
              height="100%"
              objectFit="contain"
            />
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default ImageCarousel; 