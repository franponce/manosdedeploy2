import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  Checkbox,
  useToast,
} from "@chakra-ui/react";

interface PaymentMethods {
  mercadoPago: boolean;
  cashOnPickup: boolean;
  cashOnDelivery: boolean;
  bankTransfer: boolean;
}

const PaymentMethodsConfig: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    mercadoPago: false,
    cashOnPickup: false,
    cashOnDelivery: false,
    bankTransfer: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment-methods");
        if (!response.ok) throw new Error("Failed to fetch payment methods");
        const data = await response.json();
        setPaymentMethods(data);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast({
          title: "Error",
          description: "Failed to fetch payment methods",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchPaymentMethods();
  }, [toast]);

  const handleTogglePaymentMethod = async (method: keyof PaymentMethods) => {
    setIsLoading(true);
    try {
      const updatedMethods = { ...paymentMethods, [method]: !paymentMethods[method] };
      const response = await fetch("/api/update-payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMethods),
      });
      if (!response.ok) throw new Error("Failed to update payment methods");
      const data = await response.json();
      setPaymentMethods(data);
      toast({
        title: "Éxito",
        description: `Método de pago ${data[method] ? "activado" : "desactivado"}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating payment methods:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar los métodos de pago",
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
      <VStack align="start" spacing={4}>
        <Heading size="md">Métodos de Pago Disponibles</Heading>
        <Checkbox
          isChecked={paymentMethods.mercadoPago}
          onChange={() => handleTogglePaymentMethod('mercadoPago')}
          isDisabled={isLoading}
        >
          MercadoPago
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.cashOnPickup}
          onChange={() => handleTogglePaymentMethod('cashOnPickup')}
          isDisabled={isLoading}
        >
          Efectivo al retirar
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.cashOnDelivery}
          onChange={() => handleTogglePaymentMethod('cashOnDelivery')}
          isDisabled={isLoading}
        >
          Efectivo al recibir
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.bankTransfer}
          onChange={() => handleTogglePaymentMethod('bankTransfer')}
          isDisabled={isLoading}
        >
          Transferencia bancaria
        </Checkbox>
      </VStack>
    </Box>
  );
};

export default PaymentMethodsConfig;