import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Stack,
  AspectRatio,
  Skeleton,
  SkeletonText,
  useMediaQuery,
  useDisclosure,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  ModalContent,
  Modal,
  ModalOverlay,
} from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import { useSiteInfo } from '../../hooks/useSiteInfo';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onAdd, isLoading }) => {
  const { siteInfo } = useSiteInfo();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);

  if (!product && !isLoading) {
    return null;
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const toggleTitle = () => {
    if (!isMobile) {
      setIsTitleExpanded(!isTitleExpanded);
    }
  };

  const handleTitleRef = (node: HTMLParagraphElement | null) => {
    if (node) {
      setIsTitleTruncated(node.scrollHeight > node.clientHeight);
    }
  };

  const renderTitle = () => {
    if (isMobile) {
      return (
        <Box>
          <Text
            ref={handleTitleRef}
            fontWeight="bold"
            fontSize="lg"
            noOfLines={2}
            onClick={isTitleTruncated ? onOpen : undefined}
            cursor={isTitleTruncated ? "pointer" : "default"}
          >
            {product.title || 'Untitled Product'}
          </Text>
          {isTitleTruncated && (
            <Text fontSize="xs" color="blue.500" mt={1} onClick={onOpen} cursor="pointer">
              Ver título completo
            </Text>
          )}
        </Box>
      );
    } else {
      return (
        <Box
          onMouseEnter={() => setIsTitleExpanded(true)}
          onMouseLeave={() => setIsTitleExpanded(false)}
          onClick={toggleTitle}
          cursor="pointer"
        >
          <Text 
            fontWeight="bold" 
            fontSize="lg" 
            noOfLines={isTitleExpanded ? undefined : 2}
          >
            {product.title || 'Untitled Product'}
          </Text>
        </Box>
      );
    }
  };

  const renderDescription = () => {
    return (
      <Box>
        <div
          dangerouslySetInnerHTML={{ __html: product.description || 'No description available' }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: isDescriptionExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
          }}
        />
        {(product.description?.length || 0) > 150 && (
          <Button
            size="xs"
            variant="link"
            color="blue.500"
            onClick={toggleDescription}
            mt={1}
          >
            {isDescriptionExpanded ? "Ver menos" : "Ver más"}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box borderWidth={1} borderRadius="lg" overflow="hidden">
      <AspectRatio ratio={1}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <Image 
            src={product.image || 'https://via.placeholder.com/500'} 
            alt={product.title || 'Product image'} 
            objectFit="cover" 
            fallbackSrc="https://via.placeholder.com/500"
          />
        )}
      </AspectRatio>
      <Box p={4}>
        <Stack spacing={2}>
          {isLoading ? (
            <>
              <SkeletonText noOfLines={2} spacing="4" />
              <SkeletonText noOfLines={3} spacing="4" />
              <Skeleton height="24px" />
              <Skeleton height="40px" />
            </>
          ) : (
            <>
              {renderTitle()}
              {renderDescription()}
              <Text fontWeight="bold" fontSize="xl">
                {parseCurrency(product.price || 0)} {siteInfo?.currency}
              </Text>
              <Button colorScheme="blue" onClick={() => onAdd(product)}>
                Agregar al carrito
              </Button>
            </>
          )}
        </Stack>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Título del producto</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontSize="lg">{product.title}</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProductCard;
