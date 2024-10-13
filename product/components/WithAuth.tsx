import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner } from '@chakra-ui/react';

const WithAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthComponent: React.FC<P> = (props) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        const currentTime = Date.now();
        const sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

        if (isLoggedIn && lastLoginTime && (currentTime - parseInt(lastLoginTime)) < sessionTimeout) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('lastLoginTime');
          router.push('/login');
        }
        setIsLoading(false);
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Spinner size="xl" />
        </Box>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default WithAuth;