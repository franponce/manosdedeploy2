import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Image,
  Flex,
  IconButton,
  useBreakpointValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
  title: string;
  variant: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title, variant }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const processedImages = useMemo(() => {
    return images.filter(Boolean).map(url => url.split('|||')[0].trim());
  }, [images]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === processedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? processedImages.length - 1 : prev - 1
    );
  };

  return (
    <Box position="relative">
      <Image
        src={processedImages[currentImageIndex]}
        alt={`${title} - Imagen ${currentImageIndex + 1}`}
        width="100%"
        height="auto"
        maxHeight={variant === 'product' ? "600px" : "300px"}
        objectFit="contain"
        loading="lazy"
        pointerEvents="none"
      />

      {isDesktop && processedImages.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left="0"
            top="50%"
            transform="translateY(-50%)"
            onClick={handlePrevious}
            bg="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.900" }}
          />
          <IconButton
            aria-label="Next image"
            icon={<ChevronRightIcon />}
            position="absolute"
            right="0"
            top="50%"
            transform="translateY(-50%)"
            onClick={handleNext}
            bg="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.900" }}
          />
        </>
      )}

      {processedImages.length > 1 && (
        <Flex justify="center" mt={2} gap={2}>
          {processedImages.map((_, index) => (
            <Box
              key={index}
              width="2"
              height="2"
              borderRadius="full"
              bg={index === currentImageIndex ? "blue.500" : "gray.300"}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default ImageCarousel; 