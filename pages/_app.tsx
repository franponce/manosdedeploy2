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
import { FaArrowLeft } from 'react-icons/fa';

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
  const isProductPage = router.pathname.includes('/product/');

  React.useEffect(() => {
    const checkAuthStatus = () => {
      const cookies = parseCookies();
      const authToken = cookies.authToken;
      const hasRefreshedBefore = localStorage.getItem('hasRefreshedAdmin');

      if (authToken === 'admin-token') {
        setIsLoggedIn(true);
        setIsAdmin(true);
        setUserName('Admin');
        if (router.pathname === '/admin' && !hasRefreshedBefore && !hasRefreshed) {
          localStorage.setItem('hasRefreshedAdmin', 'true');
          setHasRefreshed(true);
          window.location.reload();
        }
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
          Volver a la gestión de productos
        </Button>
      );
    }
    if (router.pathname === '/admin') {
      if (isAdmin) {
        return `Qué lindo verte de nuevo por acá, Admin`;
      } else if (isLoggedIn) {
        return `Qué lindo verte de nuevo por acá, ${userName}`;
      }
    }
    return 'Te damos la bienvenida';
  };

  const shouldShowBanner = React.useMemo(() => {
    if (router.pathname.includes('/product/')) {
      return false;
    }
    
    if (router.pathname === '/' && router.asPath === '/') {
      return true;
    }

    return true;
  }, [router.pathname, router.asPath]);

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
      <Box>
        {shouldShowBanner && (
          <>
            {announcementBar && (
              <Box 
                bg="primary.500"
                color="white"
                py={2}
                textAlign="center"
              >
                {announcementBar}
              </Box>
            )}
            <Container maxW="container.xl" p={4}>
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
                <Text dangerouslySetInnerHTML={{ __html: siteInfo?.description || '' }} />
                <Text dangerouslySetInnerHTML={{ __html: siteInfo?.description2 || '' }} />
                <Stack direction="row" mt={2} spacing={2} justify="center">
                  {siteInfo?.social?.map((social) => (
                    <Link 
                      key={social.name}
                      href={social.url}
                      isExternal
                    >
                      <Icon as={social.icon} boxSize={6} />
                    </Link>
                  ))}
                </Stack>
              </Stack>
            </Container>
          </>
        )}

        <Component {...pageProps} />
      </Box>
    </ChakraProvider>
  );
};

export default MyApp;
