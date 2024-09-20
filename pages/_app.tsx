import * as React from "react";
import Head from "next/head";
import Image from 'next/image';
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
} from "@chakra-ui/react";
import { AppProps } from "next/app";
import { Global, css } from "@emotion/react";
import NextLink from "next/link";
import { useRouter } from "next/router";

import theme from "../theme";
import { getSiteInformation, SiteInformation, DEFAULT_SITE_INFORMATION } from "../utils/siteInfo";
import CustomScripts from '../product/components/CustomScripts';

const HamburgerIcon = () => (
  <Flex flexDirection="column" justifyContent="space-between" height="24px" width="24px">
    <Box bg="currentColor" h="2px" w="24px" />
    <Box bg="currentColor" h="2px" w="24px" />
    <Box bg="currentColor" h="2px" w="24px" />
  </Flex>
);

export const AuthContext = React.createContext<{
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
});

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [siteInfo, setSiteInfo] = React.useState<SiteInformation>(DEFAULT_SITE_INFORMATION);

  React.useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    setIsMounted(true);

    const fetchSiteInfo = async () => {
      const info = await getSiteInformation();
      setSiteInfo(info);
    };
    fetchSiteInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <ChakraProvider theme={theme}>
        <Global
          styles={css`
            * {
              font-family: "Jost", sans-serif !important;
            }
          `}
        />
        <Head>
          <title>{siteInfo.title} - Catálogo online</title>
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
        </Head>
        <CustomScripts />
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
                      <NextLink href="/admin#store-info" passHref legacyBehavior>
                        <MenuItem as="a">Configuración de la tienda</MenuItem>
                      </NextLink>
                      <NextLink href="/admin#products" passHref legacyBehavior>
                        <MenuItem as="a">Gestión de productos</MenuItem>
                      </NextLink>
                      <NextLink href="/admin#mercadopago" passHref legacyBehavior>
                        <MenuItem as="a">Configuración de MercadoPago</MenuItem>
                      </NextLink>
                      <NextLink href="/admin#scripts" passHref legacyBehavior>
                        <MenuItem as="a">Scripts personalizados</MenuItem>
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
                alt="Header image"
                src={siteInfo.bannerUrl || '/default-banner.jpg'}
                fill
                style={{ objectFit: "cover" }}
                quality={100}
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
                alt="Avatar"
                src={siteInfo.logoUrl || '/default-avatar.jpg'}
                fill
                style={{ objectFit: "cover" }}
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
              <Heading size="lg">{siteInfo.title}</Heading>
              <Text color="gray.600" fontSize="md">
                {siteInfo.description}
              </Text>
              <Text color="gray.600" fontSize="md">
                {siteInfo.description2}
              </Text>
              <Stack direction="row" mt={2} spacing={2}>
                {siteInfo.social.map((social) => (
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
                      <img 
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
    </AuthContext.Provider>
  );
};

export default App;