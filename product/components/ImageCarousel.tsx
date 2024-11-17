import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Image,
  Flex,
  IconButton,
  useBreakpointValue,
  SimpleGrid
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

  useEffect(() => {
    if (processedImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        if (prev === processedImages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [processedImages.length]);

  return (
    <Box position="relative" width="100%">
      <Flex 
        overflowX="hidden" 
        width="100%"
        position="relative"
        paddingTop={variant === 'product' ? "100%" : "100%"}
      >
        <SimpleGrid 
          columns={processedImages.length > 1 ? 2 : 1} 
          spacing={2} 
          width="100%"
          position="absolute"
          top="0"
          left="0"
          height="100%"
        >
          {processedImages.map((imageUrl, index) => (
            <Image
              key={index}
              src={imageUrl}
              alt={`${title} - Imagen ${index + 1}`}
              width="100%"
              height="100%"
              objectFit="contain"
              loading="lazy"
              pointerEvents="none"
            />
          ))}
        </SimpleGrid>
      </Flex>

      {isDesktop && processedImages.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left="0"
            top="50%"
            transform="translateY(-50%)"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(prev => 
                prev === 0 ? processedImages.length - 1 : prev - 1
              );
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex(prev => 
                prev === processedImages.length - 1 ? 0 : prev + 1
              );
            }}
            bg="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.900" }}
          />
        </>
      )}

      {processedImages.length > 1 && (
        <Flex 
          justify="center" 
          position="absolute" 
          bottom="2" 
          left="0" 
          right="0" 
          gap={2}
        >
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