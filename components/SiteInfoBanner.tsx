import React, { useState } from "react";
import {
  Box,
  Image,
  Heading,
  Text,
  Stack,
  Link,
  Flex,
  Center,
  Icon,
  useToast,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { FaLink } from "react-icons/fa";

interface SiteInfoBannerProps {
  siteInfo: any;
}

const SiteInfoBanner: React.FC<SiteInfoBannerProps> = ({ siteInfo }) => {
  const toast = useToast();
  const logoUrl = React.useMemo(() => siteInfo?.logoUrl || '', [siteInfo?.logoUrl]);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace de la tienda se copió al portapapeles",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }).catch((err) => {
      console.error('Error al copiar:', err);
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  return (
    <>
      {/* Banner superior */}
      {siteInfo?.bannerText && (
        <Box 
          w="100%" 
          bg="#df7777" 
          color="white" 
          py={2} 
          textAlign="center"
          position="relative"
          top={0}
          zIndex="banner"
        >
          <Text fontSize="sm" fontWeight="medium">
            {siteInfo.bannerText}
          </Text>
        </Box>
      )}

      {/* Información principal */}
      <Box width="100%" mb={8}>
        <Center flexDirection="column" p={4}>
          <Box position="relative" width="150px" height="150px">
            {isLogoLoading && (
              <Center position="absolute" top="0" left="0" right="0" bottom="0">
                <Spinner size="xl" color="blue.500" />
              </Center>
            )}
            <Image
              src={logoUrl}
              alt="Logo"
              width={150}
              height={150}
              objectFit="contain"
              onLoad={() => setIsLogoLoading(false)}
              style={{ opacity: isLogoLoading ? 0 : 1 }}
            />
          </Box>
          
          <Heading size="xl" mb={4} textAlign="center">
            {siteInfo?.title}
          </Heading>
          
          <Text 
            color="gray.600" 
            mb={2} 
            textAlign="center"
            maxW="container.md"
            dangerouslySetInnerHTML={{ __html: siteInfo?.description || '' }} 
          />
          <Text 
            color="gray.600" 
            mb={6} 
            textAlign="center"
            maxW="container.md"
            dangerouslySetInnerHTML={{ __html: siteInfo?.description2 || '' }} 
          />
          
          <Stack direction="row" spacing={4} justify="center" align="center">
            {siteInfo?.social?.map((social: any) => (
              <Link key={social.name} href={social.url} isExternal>
                <Flex
                  alignItems="center"
                  backgroundColor="#df7777"
                  borderRadius="full"
                  color="white"
                  height={10}
                  justifyContent="center"
                  width={10}
                  _hover={{ opacity: 0.8 }}
                  transition="opacity 0.2s"
                >
                  <Image
                    alt={`${social.name} icon`}
                    src={`https://icongr.am/fontawesome/${social.name}.svg?size=24&color=ffffff`}
                  />
                </Flex>
              </Link>
            ))}
            <Button
              onClick={handleCopyLink}
              variant="unstyled"
              display="flex"
              alignItems="center"
              justifyContent="center"
              backgroundColor="#df7777"
              borderRadius="full"
              color="white"
              height={10}
              width={10}
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              <Icon as={FaLink} boxSize="24px" />
            </Button>
          </Stack>
        </Center>
      </Box>
    </>
  );
};

export default SiteInfoBanner; 