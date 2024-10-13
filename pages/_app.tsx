import * as React from "react";
import Head from "next/head";
import {
  ChakraProvider,
  Heading,
  Text,
  Container,
  Stack,
  Divider,
  Link,
  Box,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { AppProps } from "next/app";
import { Global, css } from "@emotion/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { SWRConfig } from 'swr';

import theme from "../theme";
import { useSiteInfo } from '../hooks/useSiteInfo';

const HamburgerIcon = () => (
  <Flex flexDirection="column" justifyContent="space-between" height="24px" width="24px">
    <Box bg="currentColor" h="2px" w="24px" />
    <Box bg="currentColor" h="2px" w="24px" />
    <Box bg="currentColor" h="2px" w="24px" />
  </Flex>
);

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const { siteInfo, isLoading, isError } = useSiteInfo();
  const [bannerError, setBannerError] = React.useState(false);
  const [customScripts, setCustomScripts] = React.useState<string | null>(null);
  const [announcementBar, setAnnouncementBar] = React.useState<any>(null);

  const checkLoginStatus = React.useCallback(() => {
    const loginStatus = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loginStatus);
  }, []);

  React.useEffect(() => {
    checkLoginStatus();
    setIsMounted(true);

    window.addEventListener('storage', checkLoginStatus);

    // Fetch custom scripts
    fetch('/api/get-scripts')
      .then(response => response.json())
      .then(data => setCustomScripts(data.scripts))
      .catch(error => console.error('Error fetching custom scripts:', error));

    // Load announcement bar configuration
    const loadedConfig = localStorage.getItem('announcementBarConfig');
    if (loadedConfig) {
      setAnnouncementBar(JSON.parse(loadedConfig));
    }

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [checkLoginStatus]);

  React.useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url === '/admin' && isLoggedIn) {
        // Forzar un refresh de la página
        window.location.reload();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    router.push("/");
  };

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Spinner /></Box>;
  if (isError) return <Box>Error al cargar la información del sitio</Box>;

  return (
    <ChakraProvider theme={theme}>
      <Global
        styles={css`
          * {
            font-family: "Jost", sans-serif !important;
          }
        `}
      />
      <Head>
        <title>{siteInfo?.title || 'Catálogo online'}</title>
        <meta
          content="initial-scale=1.0, width=device-width"
          name="viewport"
        />
        <meta content="Frank" name="author" />
        <meta content="Frank" name="copyright" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost&display=swap"
          rel="stylesheet"
        />
        {customScripts && (
          <script dangerouslySetInnerHTML={{ __html: customScripts }} />
        )}
      </Head>
      {announcementBar && announcementBar.isEnabled && (
        <Box bg="blue.500" color="white" py={2}>
          <Container maxW="container.xl">
            <Flex justify="space-between">
              {[1, 2, 3].map((num) => (
                announcementBar[`message${num}`] && (
                  <Link key={num} href={announcementBar[`link${num}`]} isExternal>
                    {announcementBar[`message${num}`]}
                  </Link>
                )
              ))}
            </Flex>
          </Container>
        </Box>
      )}
      <Container
        backgroundColor="white"
        borderRadius="sm"
        maxWidth="container.xl"
        padding={4}
      >
        <Flex alignItems="center" justifyContent="space-between" mb={4}>
          <Heading size="md">Te damos la bienvenida</Heading>
          {isMounted && (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<HamburgerIcon />}
                variant="outline"
              />
              <MenuList>
                {isLoggedIn ? (
                  <>
                    <NextLink href="/admin" passHref legacyBehavior>
                      <MenuItem as="a">Panel Administrador</MenuItem>
                    </NextLink>
                    <NextLink href="/store-config" passHref legacyBehavior>
                      <MenuItem as="a">Configuración de la tienda</MenuItem>
                    </NextLink>
                    <NextLink href="/diseno" passHref legacyBehavior>
                      <MenuItem as="a">Diseño</MenuItem>
                    </NextLink>
                    <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
                  </>
                ) : (
                  <NextLink href="/login" passHref legacyBehavior>
                    <MenuItem as="a">Iniciar Sesión</MenuItem>
                  </NextLink>
                )}
              </MenuList>
            </Menu>
          )}
        </Flex>
        <Box mb={6} position="relative">
          <Box
            borderRadius="lg"
            height={{ md: "300px" }}
            overflow="hidden"
            width="100%"
            position="relative"
          >
            <Image
              src={bannerError ? "/default-banner.jpg" : `${siteInfo?.bannerUrl}?${new Date().getTime()}`}
              alt="Header image"
              objectFit="cover"
              width="100%"
              height="100%"
              onError={() => setBannerError(true)}
              fallback={<Box bg="gray.200" w="100%" h="100%" />}
            />
          </Box>
        </Box>
        <Flex
          align="center"
          direction={{ base: "column", sm: "row" }}
          justify="center"
          mb={6}
        >
          <Box
            backgroundColor="white"
            borderRadius="full"
            boxShadow="md"
            boxSize={{ base: "100px", sm: "120px" }}
            marginBottom={{ base: 4, sm: 0 }}
            marginRight={{ base: 0, sm: 6 }}
            overflow="hidden"
            position="relative"
          >
            <Image
              src={`${siteInfo?.logoUrl}?${new Date().getTime()}`}
              alt="Avatar"
              objectFit="cover"
              width="100%"
              height="100%"
              fallback={<Box bg="gray.200" w="100%" h="100%" borderRadius="full" />}
            />
          </Box>
          <Stack
            align={{ base: "center", sm: "flex-start" }}
            bg="white"
            borderRadius="md"
            boxShadow="sm"
            p={4}
            spacing={3}
            textAlign={{ base: "center", sm: "left" }}
          >
            <Heading size="lg">{siteInfo?.title}</Heading>
            <Text color="gray.600" fontSize="md">
              {siteInfo?.description}
            </Text>
            <Text color="gray.600" fontSize="md">
              {siteInfo?.description2}
            </Text>
            <Stack direction="row" mt={2} spacing={2}>
              {siteInfo?.social?.map((social) => (
                <Link key={social.name} href={social.url} isExternal>
                  <Flex
                    alignItems="center"
                    backgroundColor="#df7777"
                    borderRadius="full"
                    color="white"
                    height={8}
                    justifyContent="center"
                    width={8}
                  >
                    <Image 
                      alt={`${social.name} icon`}
                      src={`https://icongr.am/fontawesome/${social.name}.svg?size=20&color=ffffff`}
                    />
                  </Flex>
                </Link>
              ))}
            </Stack>
          </Stack>
        </Flex>
        <Component {...pageProps} />
        <Divider marginY={4} />
        <Text textAlign="center">
          © Copyright {new Date().getFullYear()}. Hecho con ♥ Simple Ecommerce
        </Text>
      </Container>
    </ChakraProvider>
  );
};

export default MyApp;