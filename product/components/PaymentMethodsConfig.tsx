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
  const toast = useToast();

  useEffect(() => {
    const storedMethods = localStorage.getItem('paymentMethods');
    if (storedMethods) {
      setPaymentMethods(JSON.parse(storedMethods));
    }
  }, []);

  const handleTogglePaymentMethod = (method: keyof PaymentMethods) => {
    const updatedMethods = { ...paymentMethods, [method]: !paymentMethods[method] };
    setPaymentMethods(updatedMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
    toast({
      title: "Éxito",
      description: `Método de pago ${updatedMethods[method] ? "activado" : "desactivado"}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
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
          isChecked={paymentMethods.cashOnPickup}
          onChange={() => handleTogglePaymentMethod('cashOnPickup')}
        >
          Efectivo al retirar
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.cashOnDelivery}
          onChange={() => handleTogglePaymentMethod('cashOnDelivery')}
        >
          Efectivo al recibir
        </Checkbox>
        <Checkbox
          isChecked={paymentMethods.bankTransfer}
          onChange={() => handleTogglePaymentMethod('bankTransfer')}
        >
          Transferencia bancaria
        </Checkbox>
      </VStack>
    </Box>
  );
};

export default PaymentMethodsConfig;