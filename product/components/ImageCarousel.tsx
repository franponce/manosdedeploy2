import React, { useState, useEffect } from 'react';
import {
  Box,
  Image,
  Flex,
  Circle,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

interface ImageCarouselProps {
  images: string[];
  autoPlayInterval?: number;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images = [], 
  autoPlayInterval = 3000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
      return () => clearInterval(interval);
    }
  }, [isHovered, images.length, autoPlayInterval]);

  return (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src={images[currentIndex] || '/placeholder-image.jpg'}
        alt="Product image"
        objectFit="contain"
        width="100%"
        height="400px"
      />

      {images.length > 1 && (
        <>
          <IconButton
            aria-label="Previous image"
            icon={<ChevronLeftIcon />}
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
            opacity={isHovered ? 0.8 : 0}
            transition="opacity 0.2s"
          />

          <IconButton
            aria-label="Next image"
            icon={<ChevronRightIcon />}
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
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
            {images.map((_, index) => (
              <Circle
                key={index}
                size={2}
                bg={index === currentIndex ? "blue.500" : "gray.300"}
                cursor="pointer"
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
};

export default ImageCarousel; 