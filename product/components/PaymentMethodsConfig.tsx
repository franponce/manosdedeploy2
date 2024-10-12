import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  Checkbox,
  Button,
  useToast,
} from "@chakra-ui/react";
import { getPaymentMethods, updatePaymentMethods, PaymentMethods } from "../../utils/firebase";

const PaymentMethodsConfig: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    mercadoPago: false,
    cash: false,
    bankTransfer: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const methods = await getPaymentMethods();
    setPaymentMethods(methods);
  };

  const handleTogglePaymentMethod = (method: keyof PaymentMethods) => {
    setPaymentMethods(prev => ({ ...prev, [method]: !prev[method] }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePaymentMethods(paymentMethods);
      toast({
        title: "Configuración guardada",
        description: "Los métodos de pago se han actualizado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving payment methods:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los métodos de pago. Por favor, intente de nuevo.",
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
        >
          MercadoPago
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.cash}
          onChange={() => handleTogglePaymentMethod('cash')}
        >
          Efectivo
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.bankTransfer}
          onChange={() => handleTogglePaymentMethod('bankTransfer')}
        >
          Transferencia bancaria
        </Checkbox>
        <Button
          colorScheme="blue"
          onClick={handleSave}
          isLoading={isLoading}
        >
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default PaymentMethodsConfig;