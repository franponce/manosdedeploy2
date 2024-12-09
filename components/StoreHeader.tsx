import React from 'react';
import {
  Box,
  Container,
  Flex,
  Image,
  Text,
  HStack,
  Icon,
  IconButton,
  Tooltip,
  Link,
  VStack,
} from '@chakra-ui/react';
import { FaFacebook, FaInstagram, FaWhatsapp, FaMapMarkerAlt, FaCopy } from 'react-icons/fa';
import { useSiteInfo } from '../hooks/useSiteInfo';

const StoreHeader: React.FC = () => {
  const { siteInfo } = useSiteInfo();
  const [copied, setCopied] = React.useState(false);

  const handleCopyAddress = () => {
    if (siteInfo?.address) {
      navigator.clipboard.writeText(siteInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!siteInfo) return null;

  return (
    <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
      <Container maxW="container.xl">
        <VStack spacing={4}>
          {/* Logo y Nombre */}
          <Flex align="center" justify="center" w="100%">
            {siteInfo.logo && (
              <Image
                src={siteInfo.logo}
                alt={siteInfo.storeName || 'Logo'}
                height="60px"
                objectFit="contain"
                mr={3}
              />
            )}
            <Text fontSize="2xl" fontWeight="bold">
              {siteInfo.storeName}
            </Text>
          </Flex>

          {/* Información de la tienda */}
          <Text textAlign="center" color="gray.600">
            {siteInfo.description}
          </Text>

          {/* Dirección con botón de copiar */}
          {siteInfo.address && (
            <Flex align="center" justify="center">
              <Icon as={FaMapMarkerAlt} color="gray.500" mr={2} />
              <Text color="gray.600" mr={2}>{siteInfo.address}</Text>
              <Tooltip label={copied ? "¡Copiado!" : "Copiar dirección"}>
                <IconButton
                  aria-label="Copiar dirección"
                  icon={<FaCopy />}
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAddress}
                />
              </Tooltip>
            </Flex>
          )}

          {/* Redes sociales */}
          <HStack spacing={4} justify="center">
            {siteInfo.facebook && (
              <Link href={siteInfo.facebook} isExternal>
                <Icon as={FaFacebook} boxSize={6} color="blue.500" />
              </Link>
            )}
            {siteInfo.instagram && (
              <Link href={siteInfo.instagram} isExternal>
                <Icon as={FaInstagram} boxSize={6} color="pink.500" />
              </Link>
            )}
            {siteInfo.whatsapp && (
              <Link href={`https://wa.me/${siteInfo.whatsapp}`} isExternal>
                <Icon as={FaWhatsapp} boxSize={6} color="green.500" />
              </Link>
            )}
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default StoreHeader; 