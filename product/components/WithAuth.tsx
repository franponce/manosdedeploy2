import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner } from '@chakra-ui/react';
import { auth } from '../../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const WithAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const AuthComponent: React.FC<P> = (props) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
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