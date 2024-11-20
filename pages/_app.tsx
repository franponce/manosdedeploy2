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
    
    const isStoreRoute = router.pathname === '/';
    return isStoreRoute;
  }, [router.pathname]);

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
          mb={4}
        >
          <Text fontWeight="bold">Volver a la gestión de productos</Text>
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

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Spinner /></Box>;
  if (isError) return <Box>Error al cargar la información del sitio</Box>;

  const getLayout = Component.getLayout ?? ((page) => {
    return <Layout>{page}</Layout>;
  });

  const getBannerContent = () => {
    if (isAdmin || isLoggedIn) {
      return {
        message: "Estás visualizando la tienda como un cliente.",
        showButton: true
      };
    }
    return {
      message: "",
      showButton: false
    };
  };

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
        {!isLoginPage && !isProductDetail && (
          <>
            {announcementBar?.isEnabled && <AnnouncementBanner announcementBar={announcementBar} />}
            
            <Box
              position="fixed"
              top={announcementBar?.isEnabled ? "40px" : 0}
              left={0}
              right={0}
              zIndex={1000}
              bg="white"
              boxShadow="md"
            >
              <Container maxWidth="container.xl" padding={4}>
                <Flex alignItems="center" justifyContent="space-between">
                  <Box>
                    {getWelcomeMessage()}
                  </Box>
                  {isMounted && (
                    <HamburgerMenu
                      isLoggedIn={isLoggedIn}
                      isAdmin={isAdmin}
                      onLogout={handleLogout}
                    />
                  )}
                </Flex>
              </Container>
            </Box>
          </>
        )}
        {showPreviewBanner && (
          <Box
            position="sticky"
            top="70px"
            zIndex={999}
            bg="blue.50"
            py={{ base: 2, md: 3 }}
            borderBottom="1px"
            borderColor="blue.100"
          >
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
                    {getBannerContent().message}
                  </Text>
                </Flex>
                {getBannerContent().showButton && (
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

          {/* Footer común para todas las rutas */}
          <Box mt="auto">
            <Divider marginY={4} />
            <Text textAlign="center" pb={4}>
              © Copyright {new Date().getFullYear()}. Hecho con ♥ Simple Ecommerce
            </Text>
          </Box>
        </Box>
      </ChakraProvider>
    </SWRConfig>
  );
};

export default MyApp;