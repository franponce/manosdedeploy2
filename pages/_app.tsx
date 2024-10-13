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
import { parseCookies, destroyCookie } from 'nookies';

import theme from "../theme";
import { useSiteInfo } from '../hooks/useSiteInfo';
import { auth, logoutUser } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const { siteInfo, isLoading, isError } = useSiteInfo();
  const [bannerError, setBannerError] = React.useState(false);
  const [customScripts, setCustomScripts] = React.useState<string | null>(null);
  const [announcementBar, setAnnouncementBar] = React.useState<any>(null);

  React.useEffect(() => {
    const checkAuthStatus = () => {
      const cookies = parseCookies();
      const authToken = cookies.authToken;

      if (authToken === 'admin-token') {
        setIsLoggedIn(true);
        setIsAdmin(true);
      } else {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setIsLoggedIn(true);
            setIsAdmin(false);  // Asumimos que los usuarios de Firebase no son admin
          } else {
            setIsLoggedIn(false);
            setIsAdmin(false);
            destroyCookie(null, 'authToken');
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
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setIsAdmin(false);
      destroyCookie(null, 'authToken');
      router.push("/");
    } catch (error) {
      console.error('Error during logout:', error);
    }
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
                    {isAdmin && (
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
                      </>
                    )}
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