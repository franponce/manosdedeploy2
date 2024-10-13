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
  Link
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { getSiteInformation, loginUser, resetPassword } from '../utils/firebase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const fetchStoreName = async () => {
      const siteInfo = await getSiteInformation();
      setStoreName(siteInfo.title);
    };
    fetchStoreName();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await loginUser(email, password);
      if (user) {
        // Si el inicio de sesión es exitoso, redirigir al panel de administración
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
        title: 'Esta acción no es posible',
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

  return (
    <Box margin="auto" maxWidth="400px" mt={8}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="xl">¡Hola de nuevo! 👋</Heading>
        <Text fontSize="lg">Inicia sesión a <strong>{storeName}</strong></Text>
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
            <Button colorScheme="blue" type="submit" width="full" isLoading={isLoading}>
              Iniciar sesión
            </Button>
          </VStack>
        </form>
        <Link color="blue.500" onClick={handleResetPassword} textAlign="center">
          ¿Olvidaste tu contraseña?
        </Link>
      </VStack>
    </Box>
  );
};

export default LoginPage;