import { Box, Spinner } from '@chakra-ui/react';

const LoadingOverlay = () => (
  <Box
    position="fixed"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bg="rgba(255, 255, 255, 0.8)"
    zIndex={9999}
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    <Spinner size="xl" color="blue.500" />
  </Box>
);

export default LoadingOverlay; 