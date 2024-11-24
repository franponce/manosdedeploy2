import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  VStack, 
  Heading, 
  Text, 
  useToast, 
  InputGroup, 
  InputRightElement,
  IconButton,
  Link,
  Image,
  Stack,
  Spinner,
  Skeleton
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { getSiteInformation, loginUser, resetPassword } from '../utils/firebase';
import { useSiteInfo } from '../hooks/useSiteInfo';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { siteInfo, isLoading: siteInfoLoading } = useSiteInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await loginUser(email, password);
      if (user) {
        router.push('/admin');
      } else {
        throw new Error('Inicio de sesión fallido');
      }
    } catch (error) {
      console.error('Error durante la autenticación:', error);
      toast({
        title: 'Error de autenticación',
        description: 'Email o contraseña incorrectos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Por favor, ingresa tu email para restablecer la contraseña',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (email === 'admin') {
        toast({
          title: 'Error',
          description: 'No se puede restablecer la contraseña para el usuario admin',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await resetPassword(email);
        toast({
          title: 'Email enviado',
          description: 'Se ha enviado un email para restablecer tu contraseña',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error al enviar el email de restablecimiento:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el email de restablecimiento',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (siteInfoLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box 
      display="flex" 
      flexDirection={{ base: "column", md: "row" }}
      minHeight="calc(100vh - 70px)"
      gap={{ base: 8, md: 0 }}
    >
      {/* Lado izquierdo - Formulario */}
      <Box 
        flex={{ base: "1", md: "1" }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={{ base: 4, md: 8 }}
        order={{ base: 1, md: 1 }}
      >
        <VStack 
          spacing={6} 
          align="stretch"
          maxW="400px"
          width="100%"
        >
          <Box>
            <Heading as="h1" size="xl" mb={2}>¡Hola de nuevo! 👋</Heading>
            <Text fontSize="lg">Inicia sesión a <strong>{siteInfo?.title}</strong></Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email o Usuario</FormLabel>
                <Input 
                  type="text" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Contraseña</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={togglePasswordVisibility}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button 
                colorScheme="blue" 
                type="submit" 
                width="full" 
                isLoading={isLoading}
              >
                Iniciar sesión
              </Button>
            </VStack>
          </form>

          <Link 
            color="blue.500" 
            onClick={handleResetPassword} 
            textAlign="center"
            display="block"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </VStack>
      </Box>

      {/* Lado derecho - Logo y Descripción */}
      <Box 
        flex={{ base: "1", md: "1" }}
        display={{ base: "none", md: "flex" }}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bg="gray.50"
        position="relative"
        order={{ base: 2, md: 2 }}
        height="100vh"
        py={20}
      >
        <Stack
          spacing={8}
          maxW="400px"
          w="100%"
          px={8}
          bg="white"
          borderRadius="3xl"
          boxShadow="lg"
          py={12}
          mx={4}
        >
          <Skeleton isLoaded={!siteInfoLoading} borderRadius="full">
            <Box boxSize="120px" mx="auto">
              {siteInfo?.logoUrl ? (
                <Image
                  src={siteInfo.logoUrl}
                  alt="Store logo"
                  objectFit="cover"
                  width="100%"
                  height="100%"
                />
              ) : (
                <Box bg="gray.100" width="100%" height="100%" borderRadius="full" />
              )}
            </Box>
          </Skeleton>
          
          <Stack align="center" spacing={6}>
            <Skeleton isLoaded={!siteInfoLoading} height="40px" width="200px">
              <Heading size="lg">{siteInfo?.title || ''}</Heading>
            </Skeleton>
            
            <Skeleton isLoaded={!siteInfoLoading} height="20px" width="300px">
              <Text color="gray.600" fontSize="md">
                {siteInfo?.description || ''}
              </Text>
            </Skeleton>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default LoginPage;