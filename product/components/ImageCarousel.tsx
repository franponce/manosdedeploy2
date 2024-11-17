import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  Flex,
  Circle,
  IconButton,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
  showControls?: boolean;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images = [], 
  autoPlayInterval = 4000,
  showControls = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const filteredImages = images.filter(Boolean);
  const imageSize = useBreakpointValue({ base: "300px", md: "400px" });

  useEffect(() => {
    if (!isHovered && filteredImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isHovered, filteredImages.length, autoPlayInterval]);

  if (!filteredImages.length) {
    return (
      <Box
        height={imageSize}
        bg="gray.100"
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box color="gray.500">No hay imágenes disponibles</Box>
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      borderRadius="md"
      overflow="hidden"
    >
      <Image
        src={filteredImages[currentIndex]}
        alt={`Imagen del producto ${currentIndex + 1}`}
        objectFit="contain"
        width="100%"
        height={imageSize}
        bg="white"
      />

      {showControls && filteredImages.length > 1 && (
        <>
          <IconButton
            aria-label="Imagen anterior"
            icon={<ChevronLeftIcon boxSize={8} />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={handlePrevious}
            variant="ghost"
            colorScheme="blackAlpha"
            bg="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.900" }}
            isRound
            size="lg"
            opacity={isHovered ? 0.8 : 0}
            transition="opacity 0.2s"
          />

          <IconButton
            aria-label="Siguiente imagen"
            icon={<ChevronRightIcon boxSize={8} />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={handleNext}
            variant="ghost"
            colorScheme="blackAlpha"
            bg="whiteAlpha.700"
            _hover={{ bg: "whiteAlpha.900" }}
            isRound
            size="lg"
            opacity={isHovered ? 0.8 : 0}
            transition="opacity 0.2s"
          />

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
                bg={index === currentIndex ? "blue.500" : "whiteAlpha.700"}
                cursor="pointer"
                onClick={() => setCurrentIndex(index)}
                transition="background-color 0.2s"
                _hover={{ bg: index === currentIndex ? "blue.600" : "whiteAlpha.900" }}
              />
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
};

export default ImageCarousel; 