import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  HStack,
  FormControl,
  FormLabel,
  Switch,
  useToast,
} from "@chakra-ui/react";

const MercadoPagoConfig: React.FC = () => {
  const [isMercadoPagoEnabled, setIsMercadoPagoEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchMercadoPagoStatus = async () => {
      try {
        const response = await fetch("/api/mercadopago-status");
        if (!response.ok) throw new Error("Failed to fetch MercadoPago status");
        const data = await response.json();
        setIsMercadoPagoEnabled(data.enabled);
      } catch (error) {
        console.error("Error fetching MercadoPago status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch MercadoPago status",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchMercadoPagoStatus();
  }, [toast]);

  const handleToggleMercadoPago = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/toggle-mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !isMercadoPagoEnabled }),
      });
      if (!response.ok) throw new Error("Failed to toggle MercadoPago");
      const data = await response.json();
      setIsMercadoPagoEnabled(data.enabled);
      toast({
        title: "Éxito",
        description: `MercadoPago ha sido ${data.enabled ? "activado" : "desactivado"}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error toggling MercadoPago:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de MercadoPago",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>
        Configuración de MercadoPago
      </Heading>
      <HStack>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="mercadopago-switch" mb="0">
            {isMercadoPagoEnabled ? "Desactivar" : "Activar"} MercadoPago
          </FormLabel>
          <Switch
            id="mercadopago-switch"
            isChecked={isMercadoPagoEnabled}
            onChange={handleToggleMercadoPago}
            isDisabled={isLoading}
          />
        </FormControl>
      </HStack>
    </Box>
  );
};

export default MercadoPagoConfig;