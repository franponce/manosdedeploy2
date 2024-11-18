import React, { useState } from 'react';
import { Box, IconButton, Image, Flex, HStack } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <Image
        src={images[0]}
        alt="Producto"
        objectFit="cover"
        width="100%"
        borderRadius="md"
      />
    );
  }

  return (
    <Box position="relative">
      <Flex justify="center" align="center">
        <IconButton
          aria-label="Anterior"
          icon={<ChevronLeftIcon />}
          onClick={handlePrevious}
          position="absolute"
          left={2}
          zIndex={2}
        />
        <Image
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          objectFit="cover"
          width="100%"
          borderRadius="md"
        />
        <IconButton
          aria-label="Siguiente"
          icon={<ChevronRightIcon />}
          onClick={handleNext}
          position="absolute"
          right={2}
          zIndex={2}
        />
      </Flex>
      
      <HStack justify="center" mt={4} spacing={2}>
        {images.map((_, index) => (
          <Box
            key={index}
            w="2"
            h="2"
            borderRadius="full"
            bg={index === currentIndex ? "blue.500" : "gray.300"}
            cursor="pointer"
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </HStack>
    </Box>
  );
};

export default ImageCarousel; 