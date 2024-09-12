import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, useToast } from '@chakra-ui/react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const toast = useToast();

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

  return (
    <Box margin="auto" maxWidth="400px" mt={8}>
      <Heading mb={6}>Iniciar sesión</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Usuario</FormLabel>
            <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Contraseña</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormControl>
          <Button colorScheme="blue" type="submit" width="full">
            Iniciar sesión
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default LoginPage;