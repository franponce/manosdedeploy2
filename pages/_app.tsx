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
  Image,
  Spinner,
  Button,
  Icon,
  useToast,
  Skeleton,
} from "@chakra-ui/react";
import { AppProps } from "next/app";
import { Global, css } from "@emotion/react";
import { useRouter } from "next/router";
import { SWRConfig } from 'swr';
import NextLink from 'next/link';
import theme from "../theme";
import { useSiteInfo } from '../hooks/useSiteInfo';
import { auth, logoutUser } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { parseCookies, destroyCookie } from 'nookies';
import HamburgerMenu from '../product/components/HamburgerMenu';
import { FaArrowLeft, FaEye, FaArrowRight, FaLink } from 'react-icons/fa';
import type { NextPage } from 'next';
import Layout from "@/app/layout";
import SiteInfoCollapsible from '../components/SiteInfoCollapsible';
import AnnouncementBanner from '../components/AnnouncementBanner';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactElement;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [userName, setUserName] = React.useState('');
  const { siteInfo, isLoading, isError } = useSiteInfo();
  const [bannerError, setBannerError] = React.useState(false);
  const [customScripts, setCustomScripts] = React.useState<string | null>(null);
  const [announcementBar, setAnnouncementBar] = React.useState<any>(null);
  const [hasRefreshed, setHasRefreshed] = React.useState(false);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const toast = useToast();

  const showPreviewBanner = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    return (isAdmin || isLoggedIn) && (
      router.pathname === '/' || 
      router.query.preview === 'true' || 
      localStorage.getItem('previewMode') === 'true'
    );
  }, [isAdmin, isLoggedIn, router.pathname, router.query.preview]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((isAdmin || isLoggedIn) && router.pathname === '/') {
      setIsPreviewMode(true);
    } else if (router.query.preview === 'true') {
      localStorage.setItem('previewMode', 'true');
      setIsPreviewMode(true);
    } else if (!router.pathname.startsWith('/') && router.pathname !== '/preview') {
      localStorage.removeItem('previewMode');
      setIsPreviewMode(false);
    }
  }, [router.pathname, router.query.preview, isAdmin, isLoggedIn]);

  const handleClosePreview = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('previewMode');
    }
    setIsPreviewMode(false);
    router.push('/admin');
  };

  React.useEffect(() => {
    const checkAuthStatus = () => {
      const cookies = parseCookies();
      const authToken = cookies.authToken;
      const hasRefreshedBefore = localStorage.getItem('hasRefreshedAdmin');

      if (authToken === 'admin-token') {
        setIsLoggedIn(true);
        setIsAdmin(true);
        setUserName('Admin');
      } else {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setIsLoggedIn(true);
            setIsAdmin(false);
            setUserName(user.displayName || 'Usuario');
            if (router.pathname === '/admin' && !hasRefreshedBefore && !hasRefreshed) {
              localStorage.setItem('hasRefreshedAdmin', 'true');
              setHasRefreshed(true);
              window.location.reload();
            }
          } else {
            setIsLoggedIn(false);
            setIsAdmin(false);
            setUserName('');
            destroyCookie(null, 'authToken');
            localStorage.removeItem('hasRefreshedAdmin');
          }
        });

        return () => unsubscribe();
      }
    };

    checkAuthStatus();
    setIsMounted(true);

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
  }, [router.pathname, hasRefreshed]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setIsAdmin(false);
      destroyCookie(null, 'authToken');
      localStorage.removeItem('hasRefreshedAdmin');
      router.push("/login");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  const isAdminRoute = router.pathname === '/admin' || router.pathname === '/store-config';
  const isStoreConfigRoute = router.pathname === '/store-config';

  const getWelcomeMessage = () => {
    if (router.pathname === '/login') {
      return (
        <NextLink href="/" passHref>
          <Link _hover={{ textDecoration: 'none' }}>
            <Heading size="md">Simple E-commerce</Heading>
          </Link>
        </NextLink>
      );
    }

    if (router.pathname.startsWith('/product')) {
      return (
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.back();
          }}
          colorScheme="blue"
          size="md"
          boxShadow="sm"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'md',
          }}
          transition="all 0.2s"
          alignSelf="flex-start"
          px={6}
        >
          <Text fontWeight="bold">Volver a la tienda</Text>
        </Button>
      );
    }
    
    if (router.pathname === '/store-config') {
      return (
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push('/admin');
          }}
          variant="outline"
          alignSelf="flex-start"
          size={{ base: "sm", md: "md" }}
          px={{ base: 2, sm: 4 }}
          fontSize={{ base: "xs", sm: "sm", md: "md" }}
          maxW={{ base: "180px", sm: "none" }}
          whiteSpace="normal"
          height="auto"
          py={2}
        >
          <Text 
            fontWeight="bold"
            display="block"
            lineHeight="short"
          >
            {window.innerWidth < 480 ? "Volver" : "Volver a la gestión de productos"}
          </Text>
        </Button>
      );
    }
    
    if (router.pathname === '/admin') {
      if (isAdmin) {
        return <Text fontWeight="bold">Qué lindo verte de nuevo por acá, Admin</Text>;
      } else if (isLoggedIn) {
        return <Text fontWeight="bold">Qué lindo verte de nuevo por acá, {userName}</Text>;
      }
    }
    
    return <Text fontWeight="bold">Te damos la bienvenida</Text>;
  };

  const shouldShowHeader = React.useMemo(() => {
    return !router.pathname.startsWith('/product') && router.pathname !== '/login';
  }, [router.pathname]);

  const shouldShowMenu = router.pathname !== '/login';

  const isLoginPage = router.pathname === '/login';
  const isProductDetail = router.pathname.startsWith('/product/');
  const shouldShowSiteInfo = !isLoginPage && !isProductDetail;

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

  const logoUrl = React.useMemo(() => siteInfo?.logoUrl || '', [siteInfo?.logoUrl]);

  if (isLoading) {
    return (
      <Box p={4}>
        <Flex justify="space-between" align="center" mb={8}>
          <Skeleton height="40px" width="200px" />
          <Skeleton height="40px" width="40px" borderRadius="full" />
        </Flex>
        <Stack spacing={8}>
          <Skeleton height="200px" borderRadius="lg" />
          <Stack spacing={4}>
            <Skeleton height="30px" width="200px" />
            <Skeleton height="20px" width="300px" />
            <Skeleton height="20px" width="250px" />
          </Stack>
        </Stack>
      </Box>
    );
  }
  if (isError) return <Box>Error al cargar la información del sitio</Box>;

  const getLayout = Component.getLayout ?? ((page) => {
    return <Layout>{page}</Layout>;
  });

  // Modificamos el useEffect que carga el announcement bar
  React.useEffect(() => {
    // Función para cargar la configuración del banner
    const loadAnnouncementConfig = () => {
      const loadedConfig = localStorage.getItem('announcementBarConfig');
      if (loadedConfig) {
        try {
          const parsedConfig = JSON.parse(loadedConfig);
          setAnnouncementBar(parsedConfig);
        } catch (error) {
          console.error('Error parsing announcement config:', error);
        }
      }
    };

    // Cargar inmediatamente
    loadAnnouncementConfig();

    // Agregar un listener para cambios en el localStorage
    window.addEventListener('storage', loadAnnouncementConfig);

    // Cleanup
    return () => {
      window.removeEventListener('storage', loadAnnouncementConfig);
    };
  }, []); // Solo se ejecuta una vez al montar

  // Asegurarnos de que el banner se muestre solo cuando tengamos los datos
  const showAnnouncement = React.useMemo(() => {
    return announcementBar?.isEnabled && isMounted;
  }, [announcementBar?.isEnabled, isMounted]);

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000,
        shouldRetryOnError: false
      }}
    >
      <ChakraProvider theme={theme}>
        <Global
          styles={css`
            * {
              /*font-family: "Jost", sans-serif !important;*/
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
        {shouldShowHeader && (
          <Box
            as="header"
            position="fixed"
            top={0}
            left={0}
            right={0}
            backgroundColor="white"
            zIndex={1000}
            borderBottom="1px"
            borderColor="gray.200"
          >
            <Container maxWidth="container.xl">
              <Flex
                justify="space-between"
                align="center"
                padding={{ base: 2, sm: 4 }}
                gap={2}
              >
                <Box flex="1" maxW={{ base: "70%", sm: "auto" }}>
                  {getWelcomeMessage()}
                </Box>
                <Box>
                  {shouldShowMenu && (
                    <HamburgerMenu
                      isLoggedIn={isLoggedIn}
                      isAdmin={isAdmin}
                      onLogout={handleLogout}
                      onBackToAdmin={handleBackToAdmin}
                      userName={userName}
                    />
                  )}
                </Box>
              </Flex>
            </Container>
          </Box>
        )}
        {!isLoginPage && !isProductDetail && showAnnouncement && (
          <AnnouncementBanner announcementBar={announcementBar} />
        )}
        {showPreviewBanner && (
          <Box position="sticky" top="70px" zIndex={999} bg="blue.50" py={{ base: 2, md: 3 }} borderBottom="1px" borderColor="blue.100">
            <Container maxW="container.xl">
              <Flex
                justify={{ base: "center", sm: "space-between" }}
                align="center"
                px={4}
                direction={{ base: "column", sm: "row" }}
                gap={{ base: 2, sm: 0 }}
              >
                <Flex 
                  align="center" 
                  gap={2}
                  textAlign={{ base: "center", sm: "left" }}
                >
                  <Icon as={FaEye} color="blue.500" display={{ base: "none", sm: "block" }} />
                  <Text 
                    color="blue.700"
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    {(isAdmin || isLoggedIn) 
                      ? "Estás visualizando la tienda como un cliente."
                      : "¡Bienvenido a nuestra tienda!"}
                  </Text>
                </Flex>
                {(isAdmin || isLoggedIn) && (
                  <Button
                    size={{ base: "xs", md: "sm" }}
                    colorScheme="blue"
                    variant="link"
                    rightIcon={<Icon as={FaArrowRight} />}
                    onClick={handleClosePreview}
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    Volver al administrador
                  </Button>
                )}
              </Flex>
            </Container>
          </Box>
        )}
        <Box display="flex" flexDirection="column" minHeight="100vh">
          {router.pathname === '/admin' ? (
            <Box flex="1">
              <Container maxWidth="container.xl" padding={4}>
                <Component {...pageProps} />
              </Container>
            </Box>
          ) : (
            <Box 
              flex="1" 
              pt={
                isLoginPage || isProductDetail 
                  ? "20px" 
                  : announcementBar?.isEnabled 
                    ? "110px"
                    : "70px"
              }
            >
              <Container
                backgroundColor="white"
                borderRadius="sm"
                maxWidth="container.xl"
                padding={4}
              >
                {getLayout(<Component {...pageProps} />)}
              </Container>
            </Box>
          )}

          {/* Footer condicional: no se muestra en admin */}
          {!router.pathname.startsWith('/admin') && (
            <Box mt="auto">
              <Divider marginY={4} />
              <Text textAlign="center" pb={4}>
                © Copyright {new Date().getFullYear()}. Hecho con ♥ Simple Ecommerce
              </Text>
            </Box>
          )}
        </Box>
      </ChakraProvider>
    </SWRConfig>
  );
};

export default MyApp;