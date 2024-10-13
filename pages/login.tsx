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
  IconButton
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { getSiteInformation } from '../utils/firebase';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
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
    // Autenticación hardcodeada
    if (username === 'admin' && password === 'password123') {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/admin');
    } else {
      toast({
        title: 'Error de autenticación',
        description: 'Usuario o contraseña incorrectos',
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
              <FormLabel>Usuario</FormLabel>
              <Input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
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
            <Button colorScheme="blue" type="submit" width="full">
              Iniciar sesión
            </Button>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default LoginPage;