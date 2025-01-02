import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Text,
  Button,
  VStack,
  Heading,
  Grid,
  GridItem,
  Skeleton,
  useToast,
  Icon,
  Flex,
  Stack,
  Tooltip,
  IconButton,
  HStack,
  SkeletonText,
} from '@chakra-ui/react';
import { FaArrowLeft, FaCopy } from 'react-icons/fa';
import {
  WhatsappShareButton,
  WhatsappIcon,
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  EmailShareButton,
  EmailIcon,
} from 'next-share';
import { useStock } from '../../hooks/useStock';
import { stockService } from '../../utils/stockService';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { useCart } from '../../hooks/useCart';
import { parseCurrency } from '../../utils/currency';
import CartDrawer from '@/product/components/CartDrawer';
import ImageCarousel from '@/product/components/ImageCarousel';
import { Product, CartItem } from '@/product/types';
import { GetServerSideProps } from 'next';
import { getProducts } from '../../utils/googleSheets';

interface ProductDetailProps {
  product: Product | null;
  error?: string;
}

const calculateTotal = (cart: CartItem[]) => 
  parseCurrency(cart.reduce((total, item) => total + item.price * item.quantity, 0));

const calculateQuantity = (cart: CartItem[]) => 
  cart.reduce((acc, item) => acc + item.quantity, 0);

const ProductDetail: React.FC<ProductDetailProps> = ({ product, error }) => {
  const router = useRouter();
  const { available: stock, isLoading: stockLoading } = useStock(product?.id || null);
  const { siteInfo } = useSiteInfo();
  const toast = useToast({ position: 'top' });
  const { cart, addToCart, removeFromCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState<string>('');
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10} borderRadius="lg" bg="gray.50" p={8}>
          <Heading size="lg" mb={4} color="gray.600">
            Error: {error}
          </Heading>
          <Button colorScheme="blue" onClick={() => router.push('/')}>
            Ver otros productos
          </Button>
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={10} borderRadius="lg" bg="gray.50" p={8}>
          <Heading size="lg" mb={4} color="gray.600">
            Producto no encontrado
          </Heading>
          <Text mb={6} color="gray.500">
            Lo sentimos, el producto que buscas no está disponible en este momento.
          </Text>
          <Button colorScheme="blue" onClick={() => router.push('/')}>
            Ver otros productos
          </Button>
        </Box>
      </Container>
    );
  }

  const handleAddToCart = async () => {
    try {
      const currentStock = await stockService.getAvailableStock(product.id);
      const existingItem = cart.find(item => item.id === product.id);
      const currentQuantity = existingItem?.quantity || 0;
      
      if (currentStock < currentQuantity + 1) {
        toast({
          title: "No hay suficiente stock",
          description: "Has alcanzado el límite de unidades disponibles",
          status: "error",
          duration: 3000,
        });
        return;
      }

      addToCart({
        ...product,
        quantity: 1
      });

      toast({
        title: "¡Producto agregado!",
        description: "El producto se agregó al carrito",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error al verificar stock:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el stock disponible",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleEditCart = (product: Product | CartItem, action: "increment" | "decrement") => {
    const cartItem: CartItem = 'quantity' in product 
      ? product as CartItem
      : { ...product, quantity: 1 };

    if (action === "increment") {
      const currentQuantity = cart.find(item => item.id === cartItem.id)?.quantity || 0;
      if (currentQuantity >= stock) {
        toast({
          title: "No hay suficiente stock",
          description: "Has alcanzado el límite de unidades disponibles",
          status: "error",
          duration: 3000,
        });
        return;
      }
      addToCart(cartItem);
    } else {
      removeFromCart(cartItem);
    }
  };

  const shareText = `¡Mira este producto! ${product.title} 🛒`;
  const shareTextWithPrice = `¡Descubrí ${product.title} por ${parseCurrency(product.price)}! 🛒`;
  const emailSubject = `Te comparto este producto de ${siteInfo?.storeName || 'nuestra tienda'}`;
  const emailBody = `Hola! Encontré este producto que te puede interesar:\n\n${product.title}\n${pageUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`¡Mirá este producto! ${product.title}\n${pageUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDescription = () => {
    if (!product.description) return null;

    const cleanDescription = (html: string) => {
      return html
        .replace(/<p><br><\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<\/li>\s*<li>/g, '</li><li>')
        .trim();
    };

    return (
      <Box
        width="full"
        sx={{
          '& p': {
            fontSize: { base: "sm", md: "md" },
            color: 'gray.700',
            lineHeight: 'tall',
            marginBottom: 2,
            width: "100%",
            textAlign: "left",
            '&:empty': { display: 'none' }
          },
          '& ul': {
            width: "100%",
            paddingLeft: "1rem",
            marginBottom: 3,
            listStyle: "disc"
          },
          '& li': {
            marginBottom: 1,
            textAlign: "left"
          },
          '& strong': { fontWeight: '600' },
          '& em': { fontStyle: 'italic' },
          '& br': { display: 'none' },
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          wordBreak: 'break-word'
        }}
        dangerouslySetInnerHTML={{ 
          __html: cleanDescription(product.description) 
        }}
      />
    );
  };

  const total = calculateTotal(cart);
  const quantity = calculateQuantity(cart);

  const renderTitle = () => {
    return (
      <Box width="100%">
        <Heading 
          as="h1" 
          size="xl"
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            WebkitLineClamp: isTitleExpanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
          }}
          mb={2}
        >
          {product?.title}
        </Heading>
        {product?.title && product.title.length > 60 && (
          <Button
            size="sm"
            variant="link"
            color="blue.500"
            onClick={() => setIsTitleExpanded(!isTitleExpanded)}
            mt={1}
          >
            {isTitleExpanded ? "Ver menos" : "Ver título completo"}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <>
      <Box bg="white" position="sticky" top={0} zIndex={10} borderBottom="1px" borderColor="gray.200">
        <Container maxW="container.xl" py={4}>
          <Button
            leftIcon={<Icon as={FaArrowLeft} />}
            variant="ghost"
            onClick={() => router.push('/')}
            size="md"
            bg="gray.50"
          >
            Volver a la tienda
          </Button>
        </Container>
      </Box>

      <Container maxW="container.xl" pt={20}>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
          <GridItem>
            <ImageCarousel images={product.images || []} />
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Skeleton isLoaded={!stockLoading}>
                {renderTitle()}
              </Skeleton>

              <Text fontSize="sm" color={stock === 0 ? "red.500" : "gray.600"}>
                {stockLoading ? (
                  <Skeleton height="20px" width="150px" />
                ) : stock === 0 ? (
                  "Agotado"
                ) : (
                  `Stock disponible: ${stock}`
                )}
              </Text>

              <Text fontSize="2xl" fontWeight="bold">
                {parseCurrency(product.price)}
              </Text>

              <Button
                colorScheme="blue"
                size="lg"
                width="100%"
                onClick={handleAddToCart}
                isDisabled={stock === 0}
                isLoading={stockLoading}
                mb={4}
              >
                {stock === 0 ? "Agotado" : "Agregar al carrito"}
              </Button>

              {stock > 0 && stock <= 5 && (
                <Text color="orange.500" fontSize="sm" textAlign="center" mb={4}>
                  {stock === 1 
                    ? "¡Última unidad en stock!" 
                    : `¡Últimas ${stock} unidades en stock!`}
                </Text>
              )}

              <Box>
                <Text mb={2} fontWeight="medium">Compartir producto:</Text>
                <HStack spacing={2}>
                  <Tooltip label="Compartir en WhatsApp">
                    <WhatsappShareButton url={pageUrl} title={shareTextWithPrice}>
                      <WhatsappIcon size={40} round />
                    </WhatsappShareButton>
                  </Tooltip>

                  <Tooltip label="Compartir en Facebook">
                    <FacebookShareButton url={pageUrl} quote={shareText}>
                      <FacebookIcon size={40} round />
                    </FacebookShareButton>
                  </Tooltip>

                  <Tooltip label="Compartir en Twitter">
                    <TwitterShareButton url={pageUrl} title={shareText}>
                      <TwitterIcon size={40} round />
                    </TwitterShareButton>
                  </Tooltip>

                  <Tooltip label="Compartir por email">
                    <EmailShareButton
                      url={pageUrl}
                      subject={emailSubject}
                      body={emailBody}
                    >
                      <EmailIcon size={40} round />
                    </EmailShareButton>
                  </Tooltip>

                  <Tooltip label={copied ? "¡Copiado!" : "Copiar enlace"}>
                    <IconButton
                      aria-label="Copiar enlace"
                      icon={<FaCopy />}
                      onClick={handleCopyLink}
                      size="lg"
                      colorScheme={copied ? "green" : "gray"}
                      rounded="full"
                    />
                  </Tooltip>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="medium" mb={2}>Descripción:</Text>
                {renderDescription()}
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>

      {Boolean(cart.length) && (
        <Flex alignItems="center" bottom={4} justifyContent="center" position="sticky">
          <Button
            boxShadow="xl"
            colorScheme="primary"
            data-testid="show-cart"
            size="lg"
            width={{ base: "100%", sm: "fit-content" }}
            onClick={() => setIsCartOpen(true)}
          >
            <Stack alignItems="center" direction="row" spacing={6}>
              <Stack alignItems="center" direction="row" spacing={3}>
                <Text fontSize="md" lineHeight={6}>
                  Ver carrito
                </Text>
                <Text
                  backgroundColor="rgba(0,0,0,0.25)"
                  borderRadius="sm"
                  color="gray.100"
                  fontSize="xs"
                  fontWeight="500"
                  paddingX={2}
                  paddingY={1}
                >
                  {quantity} {quantity === 1 ? "item" : "items"}
                </Text>
              </Stack>
              <Text fontSize="md" lineHeight={6}>
                {total}
              </Text>
            </Stack>
          </Button>
        </Flex>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => setIsCartOpen(false)}
        onDecrement={(product) => handleEditCart(product, "decrement")}
        onIncrement={(product) => handleEditCart(product, "increment")}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const products = await getProducts();
    const product = products.find((p: { id: string | string[] | undefined; }) => p.id === params?.id);

    if (!product) {
      return {
        props: {
          product: null,
          error: "Producto no encontrado"
        }
      };
    }

    return {
      props: {
        product,
        error: null
      }
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      props: {
        product: null,
        error: "Error al cargar el producto"
      }
    };
  }
};

export default ProductDetail; 