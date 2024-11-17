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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const processImageSrc = (src: string) => {
    if (src.includes('|||')) {
      return src.split('|||')[0];
    }
    return src;
  };

  const processedImages = useMemo(() => {
    return images.map(url => processImageSrc(url));
  }, [images]);

  const showNavigation = useBreakpointValue({ base: false, md: true });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAutoPlaying && processedImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === processedImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAutoPlaying, processedImages.length]);

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? processedImages.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentImageIndex((prevIndex) =>
      prevIndex === processedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const containerHeight = variant === 'product' ? '400px' : '200px';

  if (!processedImages.length) return null;

  return (
    <Box
      position="relative"
      width="100%"
      height={containerHeight}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {processedImages.map((imageUrl, index) => (
        <Image
          key={index}
          src={imageUrl}
          alt={`${title} - Imagen ${index + 1}`}
          style={{
            display: index === currentImageIndex ? 'block' : 'none'
          }}
          objectFit="contain"
          width="100%"
          height="100%"
          opacity={index === currentImageIndex ? 1 : 0}
          transition="opacity 0.5s ease-in-out"
          loading="lazy"
        />
      ))}

      {showNavigation && processedImages.length > 1 && (
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
            size="lg"
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
            size="lg"
          />
        </>
      )}

      {processedImages.length > 1 && (
        <Flex
          position="absolute"
          bottom="4"
          left="50%"
          transform="translateX(-50%)"
          gap={2}
        >
          {processedImages.map((_, index) => (
            <Box
              key={index}
              width="2"
              height="2"
              borderRadius="full"
              bg={index === currentImageIndex ? "white" : "whiteAlpha.400"}
              cursor="pointer"
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentImageIndex(index);
              }}
            />
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default ImageCarousel; 