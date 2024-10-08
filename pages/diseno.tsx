import React, { useState, useEffect } from 'react';
import {
  Box, VStack, Heading, FormControl, FormLabel, Input, Switch, Button, useToast
} from '@chakra-ui/react';

interface AnnouncementMessage {
  message: string;
  link: string;
}

interface AnnouncementBar {
  messages: AnnouncementMessage[];
  isEnabled: boolean;
}

const DisenoPage: React.FC = () => {
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBar>({
    messages: [
      { message: '', link: '' },
      { message: '', link: '' },
      { message: '', link: '' }
    ],
    isEnabled: false
  });
  const toast = useToast();

  useEffect(() => {
    const loadedConfig = localStorage.getItem('announcementBarConfig');
    if (loadedConfig) {
      setAnnouncementBar(JSON.parse(loadedConfig));
    }
  }, []);

  const handleInputChange = (index: number, field: 'message' | 'link', value: string) => {
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
        <Heading size="md">Encabezado</Heading>
        <Box>
          <Heading size="sm" mb={4}>Barra de anuncio</Heading>
          <VStack spacing={4}>
            {announcementBar.messages.map((msg, index) => (
              <Box key={index}>
                <FormControl>
                  <FormLabel>{`Mensaje ${index + 1}`}</FormLabel>
                  <Input
                    value={msg.message}
                    onChange={(e) => handleInputChange(index, 'message', e.target.value)}
                  />
                </FormControl>
                <FormControl mt={2}>
                  <FormLabel>{`Link ${index + 1}`}</FormLabel>
                  <Input
                    value={msg.link}
                    onChange={(e) => handleInputChange(index, 'link', e.target.value)}
                  />
                </FormControl>
              </Box>
            ))}
          </VStack>
        </Box>
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="show-announcement" mb="0">
            Mostrar barra de anuncio
          </FormLabel>
          <Switch
            id="show-announcement"
            isChecked={announcementBar.isEnabled}
            onChange={handleSwitchChange}
          />
        </FormControl>
        <Button type="submit" colorScheme="blue">Guardar cambios</Button>
      </VStack>
    </Box>
  );
};

export default DisenoPage;

