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
  onNavigate?: () => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, title, variant, onNavigate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const processedImages = useMemo(() => {
    return images.filter(Boolean).map(url => url.split('|||')[0].trim());
  }, [images]);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === processedImages.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? processedImages.length - 1 : prev - 1
    );
  };

  const dimensions = {
    product: {
      container: { width: "100%", height: "auto", maxHeight: "600px" },
      image: { width: "100%", height: "auto", maxHeight: "600px" }
    },
    store: {
      container: { width: "100%", height: "auto", maxHeight: "300px" },
      image: { width: "100%", height: "auto", maxHeight: "300px" }
    }
  };

  const currentDimensions = variant === 'product' ? dimensions.product : dimensions.store;
  const showNavigation = useBreakpointValue({ base: false, md: true });

  return (
    <Box 
      position="relative" 
      {...currentDimensions.container}
      overflow="hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Flex
        transition="transform 0.3s ease-in-out"
        transform={`translateX(-${currentImageIndex * 100}%)`}
        width={`${processedImages.length * 100}%`}
      >
        {processedImages.map((imageUrl, index) => (
          <Box
            key={index}
            width={`${100 / processedImages.length}%`}
            height="100%"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) onNavigate();
            }}
          >
            <Image
              src={imageUrl}
              alt={`${title} - Imagen ${index + 1}`}
              objectFit="contain"
              width="100%"
              height="100%"
              loading="lazy"
            />
          </Box>
        ))}
      </Flex>

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
              onClick={(e) => {
                e.stopPropagation();
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