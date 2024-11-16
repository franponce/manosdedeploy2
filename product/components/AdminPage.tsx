import React from "react";
import {
  Box,
  Heading,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { FaArrowRight, FaStore } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CustomScripts from "./CustomScripts";

const AdminPage: React.FC = () => {
  const router = useRouter();

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  return (
    <Box margin="auto" maxWidth="1200px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Panel de administración
      </Heading>

      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ base: "stretch", md: "center" }}
        mb={8}
        gap={4}
      >
        <Link href="/" passHref>
          <Button
            as="a"
            colorScheme="green"
            leftIcon={<Icon as={FaStore} />}
          >
            Ir a la tienda
          </Button>
        </Link>
        <Button
          colorScheme="gray"
          onClick={handleStoreSettings}
          rightIcon={<Icon as={FaArrowRight} />}
        >
          Ir a la configuración de la tienda
        </Button>
      </Flex>

      <VStack spacing={8} align="stretch">
        <Accordion allowMultiple defaultIndex={[0]}>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Scripts personalizados
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <CustomScripts />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Box>
  );
};

export default AdminPage;