import React, { useState, useEffect } from 'react';
import { Box, Container, Link, Flex, Text } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface AnnouncementBannerProps {
  announcementBar: AnnouncementBar;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ announcementBar }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeMessages = announcementBar.messages.filter((msg: AnnouncementMessage) => msg.isActive && msg.message.trim());

  useEffect(() => {
    if (announcementBar.displayMode === 'carousel' && activeMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeMessages.length);
      }, announcementBar.autoPlaySpeed);

      return () => clearInterval(interval);
    }
  }, [announcementBar.displayMode, activeMessages.length, announcementBar.autoPlaySpeed]);

  if (!announcementBar.isEnabled || activeMessages.length === 0) return null;

  return (
    <Box 
      bg="blue.50" 
      py={{ base: 2, md: 3 }}
      borderBottom="1px"
      borderColor="blue.100"
      position="relative"
      width="100%"
      zIndex={1001}
    >
      <Container maxW="container.xl">
        {announcementBar.displayMode === 'static' ? (
          <Flex 
            justify={activeMessages.length === 1 ? "center" : "space-around"}
            align="center"
            gap={4}
          >
            {activeMessages.map((msg, index) => (
              <Box 
                key={index} 
                textAlign="center" 
                flex={1}
                fontSize={{ base: "sm", md: "md" }}
                color="blue.700"
                fontWeight="medium"
              >
                {msg.link ? (
                  <Link 
                    href={msg.link} 
                    isExternal 
                    _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                  >
                    {msg.message}
                  </Link>
                ) : (
                  <Text>{msg.message}</Text>
                )}
              </Box>
            ))}
          </Flex>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box 
                textAlign="center"
                fontSize={{ base: "sm", md: "md" }}
                color="blue.700"
                fontWeight="medium"
              >
                {activeMessages[currentIndex].link ? (
                  <Link 
                    href={activeMessages[currentIndex].link} 
                    isExternal
                    _hover={{ color: 'blue.800', textDecoration: 'underline' }}
                  >
                    {activeMessages[currentIndex].message}
                  </Link>
                ) : (
                  <Text>{activeMessages[currentIndex].message}</Text>
                )}
              </Box>
            </motion.div>
          </AnimatePresence>
        )}
      </Container>
    </Box>
  );
};

export default AnnouncementBanner; 