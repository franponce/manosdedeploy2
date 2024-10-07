import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const PersistentTooltip: React.FC<PersistentTooltipProps> = ({ label, children, duration = 7000 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsOpen(false), duration);
  }, [duration]);

  const handleClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      placement="top"
      closeOnBlur={false}
      isLazy
    >
      <PopoverTrigger>
        <Box onMouseEnter={handleOpen}>
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