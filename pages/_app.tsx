import * as React from "react";
import Head from "next/head";
import {
  ChakraProvider,
  Heading,
  Container,
  Flex,
  Image,
  Button,
  Icon,
  Box,
} from "@chakra-ui/react";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import theme from "../theme";
import { useSiteInfo } from '../hooks/useSiteInfo';
import HamburgerMenu from '../product/components/HamburgerMenu';
import { FaArrowLeft } from 'react-icons/fa';

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();
  const { siteInfo } = useSiteInfo();

  const handleBackToAdmin = () => {
    router.push('/admin');
  };

  return (
    <ChakraProvider theme={theme}>
      <Head>
        <title>{siteInfo?.title || 'Catálogo online'}</title>
      </Head>
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
            {router.pathname === '/store-config' ? (
              <Button
                leftIcon={<Icon as={FaArrowLeft} />}
                onClick={handleBackToAdmin}
                variant="outline"
              >
                Volver a la gestión de productos
              </Button>
            ) : (
              <Heading size="md">Te damos la bienvenida</Heading>
            )}
            <HamburgerMenu isLoggedIn={false} isAdmin={false} onLogout={function (): void {
              throw new Error("Function not implemented.");
            } } />
          </Flex>
        </Container>
      </Box>
      <Box pt="70px">
        <Container
          backgroundColor="white"
          borderRadius="sm"
          maxWidth="container.xl"
          padding={4}
        >
          <Component {...pageProps} />
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default MyApp;
