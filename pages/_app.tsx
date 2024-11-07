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
import { FaArrowLeft, FaEye, FaArrowRight } from 'react-icons/fa';

const MyApp = ({ Component, pageProps }: AppProps) => {
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

  const showPreviewBanner = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    
    const isFromAdmin = router.query.preview === 'true' || localStorage.getItem('previewMode') === 'true';
    const isStoreRoute = router.pathname === '/';
    const isAuthorizedUser = isAdmin || isLoggedIn;

    return isAuthorizedUser && (isStoreRoute || isFromAdmin);
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
  const shouldShowSiteInfo = !isLoginPage;

  if (isLoading) return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Spinner /></Box>;
  if (isError) return <Box>Error al cargar la información del sitio</Box>;

  return (
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
      {!isLoginPage && (
        <>
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
          <Box
            position="fixed"
            top={0}
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
                  Estás visualizando la tienda como un cliente.
                </Text>
              </Flex>
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
            </Flex>
          </Container>
        </Box>
      )}
      <Box pt={isLoginPage ? "20px" : "70px"}>
        <Container
          backgroundColor="white"
          borderRadius="sm"
          maxWidth="container.xl"
          padding={4}
        >
          {isLoginPage && (
            <Flex alignItems="center" mb={4}>
              <NextLink href="/" passHref>
                <Heading as="a" size="md" cursor="pointer">
                  Simple E-commerce
                </Heading>
              </NextLink>
            </Flex>
          )}
          {shouldShowSiteInfo && (
            <>
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
                direction="column"
                align="center"
                justify="center"
                mb={6}
              >
                <Box
                  backgroundColor="white"
                  borderRadius="full"
                  boxShadow="md"
                  boxSize="120px"
                  overflow="hidden"
                  position="relative"
                  mb={4}
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
                  align="center"
                  bg="white"
                  borderRadius="md"
                  boxShadow="sm"
                  p={4}
                  spacing={3}
                  textAlign="center"
                  width="100%"
                  maxWidth="600px"
                >
                  <Heading size="lg">{siteInfo?.title}</Heading>
                  <Text color="gray.600" fontSize="md" dangerouslySetInnerHTML={{ __html: siteInfo?.description || '' }} />
                  <Text color="gray.600" fontSize="md" dangerouslySetInnerHTML={{ __html: siteInfo?.description2 || '' }} />
                  <Stack direction="row" mt={2} spacing={2} justify="center">
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
            </>
          )}
          <Component {...pageProps} />
          <Divider marginY={4} />
          <Text textAlign="center">
            © Copyright {new Date().getFullYear()}. Hecho con ♥ Simple Ecommerce
          </Text>
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default MyApp;
