import React, { useState, useMemo, useEffect } from 'react';
import { Box, Image, SimpleGrid, IconButton, Flex, useBreakpointValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
  title: string;
  variant: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title, variant }) => {
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const processedImages = useMemo(() => {
    return images.filter(Boolean).map(url => url.split('|||')[0].trim());
  }, [images]);

  const hasMultipleImages = processedImages.length > 1;

  return (
    <Box position="relative" width="100%">
      <SimpleGrid 
        columns={hasMultipleImages ? { base: 1, md: 2 } : 1}
        spacing={2}
        width="100%"
      >
        {processedImages.map((imageUrl, index) => (
          <Box 
            key={index}
            position="relative"
            paddingTop="100%"
          >
            <Image
              src={imageUrl}
              alt={`${title} - Imagen ${index + 1}`}
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              objectFit="contain"
              loading="lazy"
              pointerEvents="none"
            />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ImageCarousel; 