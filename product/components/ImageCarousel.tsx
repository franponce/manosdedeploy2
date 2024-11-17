import React, { useState } from 'react';
import { Box, Image, IconButton, Flex, useBreakpointValue } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
  title: string;
  variant: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images = [], 
  title,
  variant 
}) => {
  console.log('ImageCarousel received images:', images);
  console.log('Variant:', variant);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const isDesktop = useBreakpointValue({ base: false, md: true });

  const processedImages = images
    .filter(Boolean)
    .map(url => {
      try {
        return url.split('|||')[0].trim();
      } catch (e) {
        console.error('Error processing image URL:', url);
        return null;
      }
    })
    .filter(Boolean);

  console.log('Processed images:', processedImages);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % processedImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + processedImages.length) % processedImages.length);
  };

  // Manejo de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) { // umbral mínimo para considerar swipe
      if (diff > 0) {
        setCurrentIndex(prev => (prev + 1) % processedImages.length);
      } else {
        setCurrentIndex(prev => (prev - 1 + processedImages.length) % processedImages.length);
      }
    }
    setTouchStart(null);
  };

  // Si no hay imágenes, mostrar placeholder
  if (!processedImages.length) {
    return (
      <div className="relative aspect-square w-full">
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span>No image available</span>
        </div>
      </div>
    );
  }

  return (
    <Box 
      position="relative" 
      width="100%"
      height={variant === 'product' ? "400px" : "200px"}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Image
        src={processedImages[currentIndex] || undefined}
        alt={`${title} - Imagen ${currentIndex + 1}`}
        width="100%"
        height="100%"
        objectFit="contain"
        pointerEvents="none"
      />

      {/* Flechas de navegación en desktop */}
      {isDesktop && processedImages.length > 1 && (
        <>
          <IconButton
            aria-label="Anterior"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left="0"
            top="50%"
            transform="translateY(-50%)"
            onClick={handlePrev}
            bg="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.900" }}
          />
          <IconButton
            aria-label="Siguiente"
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

      {/* Indicadores de imagen */}
      {processedImages.length > 1 && (
        <Flex 
          position="absolute" 
          bottom="2" 
          left="0" 
          right="0" 
          justify="center" 
          gap={2}
        >
          {processedImages.map((_, index) => (
            <Box
              key={index}
              width="2"
              height="2"
              borderRadius="full"
              bg={index === currentIndex ? "blue.500" : "gray.300"}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default ImageCarousel; 