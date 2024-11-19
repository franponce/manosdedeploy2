import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, FormControl, FormLabel, Input, Switch, Button, useToast, Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper
} from '@chakra-ui/react';

interface AnnouncementMessage {
  message: string;
  link: string;
  isActive: boolean;
}

interface AnnouncementBar {
  messages: AnnouncementMessage[];
  isEnabled: boolean;
  displayMode: 'static' | 'carousel';
  autoPlaySpeed: number;
}

const DisenoPage: React.FC = () => {
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBar>({
    messages: [
      { message: '', link: '', isActive: true },
      { message: '', link: '', isActive: true },
      { message: '', link: '', isActive: true }
    ],
    isEnabled: false,
    displayMode: 'static',
    autoPlaySpeed: 3000
  });
  const toast = useToast();

  useEffect(() => {
    const loadedConfig = localStorage.getItem('announcementBarConfig');
    if (loadedConfig) {
      setAnnouncementBar(JSON.parse(loadedConfig));
    }
  }, []);

  const handleInputChange = (index: number, field: 'message' | 'link' | 'isActive', value: string | boolean) => {
    setAnnouncementBar(prev => ({
      ...prev,
      messages: prev.messages.map((msg, i) => 
        i === index ? { ...msg, [field]: value } : msg
      )
    }));
  };

  const handleSwitchChange = () => {
    setAnnouncementBar(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('announcementBarConfig', JSON.stringify(announcementBar));
    toast({
      title: "Configuración guardada",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box maxWidth="800px" margin="auto" padding={8}>
      <Heading mb={6}>Configuraciones avanzadas</Heading>
      <VStack as="form" onSubmit={handleSubmit} spacing={6} align="stretch">
        <Heading size="md">Configuración del Banner de Anuncios</Heading>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="show-announcement" mb="0">
            Activar banner de anuncios
          </FormLabel>
          <Switch
            id="show-announcement"
            isChecked={announcementBar.isEnabled}
            onChange={handleSwitchChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Modo de visualización</FormLabel>
          <Select
            value={announcementBar.displayMode}
            onChange={(e) => setAnnouncementBar(prev => ({
              ...prev,
              displayMode: e.target.value as 'static' | 'carousel'
            }))}
          >
            <option value="static">Mostrar todos los mensajes</option>
            <option value="carousel">Carrusel automático</option>
          </Select>
        </FormControl>

        {announcementBar.displayMode === 'carousel' && (
          <FormControl>
            <FormLabel>Velocidad de rotación (segundos)</FormLabel>
            <NumberInput
              value={announcementBar.autoPlaySpeed / 1000}
              onChange={(_, value) => setAnnouncementBar(prev => ({
                ...prev,
                autoPlaySpeed: value * 1000
              }))}
              min={1}
              max={10}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        )}

        <VStack spacing={4}>
          {announcementBar.messages.map((msg, index) => (
            <Box key={index} p={4} borderWidth="1px" borderRadius="md">
              <FormControl>
                <FormLabel>{`Mensaje ${index + 1}`}</FormLabel>
                <Input
                  value={msg.message}
                  onChange={(e) => handleInputChange(index, 'message', e.target.value)}
                  placeholder="Ingrese el mensaje"
                />
              </FormControl>
              
              <FormControl mt={2}>
                <FormLabel>{`Link ${index + 1}`}</FormLabel>
                <Input
                  value={msg.link}
                  onChange={(e) => handleInputChange(index, 'link', e.target.value)}
                  placeholder="Ingrese el link (opcional)"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center" mt={2}>
                <FormLabel htmlFor={`message-active-${index}`} mb="0">
                  Mensaje activo
                </FormLabel>
                <Switch
                  id={`message-active-${index}`}
                  isChecked={msg.isActive}
                  onChange={(e) => handleInputChange(index, 'isActive', e.target.checked)}
                />
              </FormControl>
            </Box>
          ))}
        </VStack>

        <Button type="submit" colorScheme="blue">
          Guardar cambios
        </Button>
      </VStack>
    </Box>
  );
};

export default DisenoPage;

