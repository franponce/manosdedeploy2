import React, { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Box,
} from '@chakra-ui/react';

interface PersistentTooltipProps {
  label: React.ReactNode;
  children: React.ReactNode;
  duration?: number; // Duración en milisegundos
}

const PersistentTooltip: React.FC<PersistentTooltipProps> = ({ label, children, duration = 5000 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => setIsOpen(false), duration);
    setTimer(newTimer);
  }, [duration]);

  const handleClose = useCallback(() => {
    if (timer) clearTimeout(timer);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timer]);

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      placement="top"
      closeOnBlur={false}
    >
      <PopoverTrigger>
        <Box
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
        >
          {children}
        </Box>
      </PopoverTrigger>
      <PopoverContent
        bg="blue.100"
        borderColor="blue.300"
        color="blue.800"
        boxShadow="md"
      >
        <PopoverArrow bg="blue.100" />
        <PopoverBody>{label}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default PersistentTooltip;