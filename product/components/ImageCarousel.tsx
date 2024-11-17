import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Image,
  Flex,
  Circle,
  IconButton,
  useBreakpointValue,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
  variant: 'store' | 'detail';
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images = [], 
  variant
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasCompletedAutoplay, setHasCompletedAutoplay] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout>();
  const filteredImages = images.filter(Boolean);
  
  const imageSize = useBreakpointValue({ 
    base: variant === 'detail' ? "350px" : "300px",
    md: variant === 'detail' ? "500px" : "300px" 
  });

  // Autoplay solo una vez
  useEffect(() => {
    if (!hasCompletedAutoplay && filteredImages.length > 1) {
      const runAutoplay = () => {
        autoplayTimeoutRef.current = setTimeout(() => {
          setCurrentIndex(prev => {
            const nextIndex = prev + 1;
            if (nextIndex >= filteredImages.length - 1) {
              setHasCompletedAutoplay(true);
              return nextIndex;
            }
            return nextIndex;
          });
        }, 3000);
      };

      runAutoplay();
    }

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, [filteredImages.length, hasCompletedAutoplay]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? filteredImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      (prev + 1) % filteredImages.length
    );
  };

  if (!filteredImages.length) {
    return (
      <Box
        height={imageSize}
        bg="gray.50"
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500">No hay imágenes disponibles</Text>
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      borderRadius="md"
      overflow="hidden"
      height={imageSize}
    >
      <Image
        key={filteredImages[currentIndex]} // Forzar re-render al cambiar imagen
        src={filteredImages[currentIndex]}
        alt={`Imagen del producto ${currentIndex + 1}`}
        objectFit="contain"
        width="100%"
        height="100%"
        bg="white"
        onLoad={() => setIsImageLoading(false)}
        onError={() => setIsImageLoading(false)}
        style={{ opacity: isImageLoading ? 0 : 1 }}
        transition="opacity 0.3s"
      />

      {isImageLoading && (
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          <Spinner color="blue.500" size="xl" />
        </Flex>
      )}

      {/* Flechas de navegación solo en detalle */}
      {variant === 'detail' && filteredImages.length > 1 && (
        <>
          <IconButton
            aria-label="Imagen anterior"
            icon={<ChevronLeftIcon boxSize={6} />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={handlePrevious}
            variant="solid"
            colorScheme="blackAlpha"
            bg="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.900" }}
            size="md"
            isRound
          />

          <IconButton
            aria-label="Siguiente imagen"
            icon={<ChevronRightIcon boxSize={6} />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={handleNext}
            variant="solid"
            colorScheme="blackAlpha"
            bg="whiteAlpha.800"
            _hover={{ bg: "whiteAlpha.900" }}
            size="md"
            isRound
          />
        </>
      )}

      {/* Puntos de navegación en ambos casos si hay más de una imagen */}
      {filteredImages.length > 1 && (
        <Flex 
          justify="center" 
          position="absolute" 
          bottom={4} 
          width="100%"
          gap={2}
        >
          {filteredImages.map((_, index) => (
            <Circle
              key={index}
              size={2}
              bg={index === currentIndex ? "blue.500" : "whiteAlpha.800"}
              cursor="pointer"
              onClick={() => setCurrentIndex(index)}
              transition="background-color 0.2s"
              _hover={{ bg: index === currentIndex ? "blue.600" : "whiteAlpha.900" }}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default ImageCarousel; 