import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  Text,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  useToast,
} from "@chakra-ui/react";

const CustomScripts: React.FC = () => {
  const [customScripts, setCustomScripts] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch("/api/get-scripts");
        if (!response.ok) {
          throw new Error("Failed to fetch scripts");
        }
        const data = await response.json();
        setCustomScripts(data.scripts);
      } catch (error) {
        console.error("Error fetching scripts:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los scripts personalizados",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchScripts();
  }, [toast]);

  const handleScriptsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomScripts(e.target.value);
  };

  const handleSaveScripts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/update-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scripts: customScripts }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update scripts");
      }
      toast({
        title: "Éxito",
        description: "Los scripts personalizados se han actualizado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating scripts:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron actualizar los scripts personalizados",
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
        Scripts personalizados
      </Heading>
      <VStack align="stretch" spacing={6}>
        <Text>
          Añade aquí scripts personalizados que se ejecutarán en todas las páginas del sitio.
          Ten cuidado al añadir scripts de terceros, ya que pueden afectar el rendimiento y la seguridad del sitio.
        </Text>
        <FormControl>
          <FormLabel>Scripts</FormLabel>
          <Textarea
            value={customScripts}
            onChange={handleScriptsChange}
            placeholder="<script>// Tu código aquí</script>"
            height="200px"
          />
        </FormControl>
        <Button
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Guardando"
          onClick={handleSaveScripts}
        >
          Guardar Scripts
        </Button>
      </VStack>
    </Box>
  );
};

export default CustomScripts;