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
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout>();
  const filteredImages = images.filter(Boolean);
  const imageSize = useBreakpointValue({ 
    base: variant === 'detail' ? "350px" : "300px",
    md: variant === 'detail' ? "500px" : "300px" 
  });

  // Precarga de imágenes
  useEffect(() => {
    if (filteredImages.length > 0) {
      const loadStates = new Array(filteredImages.length).fill(false);
      
      filteredImages.forEach((src, index) => {
        const img = new HTMLImageElement();
        img.onload = () => {
          setLoadedImages(prev => {
            const newStates = [...prev];
            newStates[index] = true;
            return newStates;
          });
        };
        img.src = src;
      });

      setLoadedImages(loadStates);
    }
  }, [filteredImages]);

  // Autoplay solo una vez
  useEffect(() => {
    if (!hasCompletedAutoplay && filteredImages.length > 1 && loadedImages[currentIndex]) {
      let currentIdx = 0;
      
      const runAutoplay = () => {
        autoplayTimeoutRef.current = setTimeout(() => {
          if (currentIdx < filteredImages.length - 1) {
            currentIdx++;
            setCurrentIndex(currentIdx);
            if (loadedImages[currentIdx]) {
              runAutoplay();
            }
          } else {
            setHasCompletedAutoplay(true);
          }
        }, 3000);
      };

      if (loadedImages[0]) {
        runAutoplay();
      }
    }

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
      }
    };
  }, [filteredImages.length, hasCompletedAutoplay, loadedImages]);

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

  return (
    <Box
      position="relative"
      borderRadius="md"
      overflow="hidden"
      height={imageSize}
    >
      {loadedImages[currentIndex] ? (
        <Image
          src={filteredImages[currentIndex]}
          alt={`Imagen del producto ${currentIndex + 1}`}
          objectFit="contain"
          width="100%"
          height="100%"
          bg="white"
        />
      ) : (
        <Flex
          height="100%"
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