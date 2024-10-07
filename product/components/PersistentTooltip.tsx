import React, { useState } from 'react';
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
}

const PersistentTooltip: React.FC<PersistentTooltipProps> = ({ label, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      placement="top"
      closeOnBlur={false}
    >
      <PopoverTrigger>
        <Box
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {children}
        </Box>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverBody>{label}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default PersistentTooltip;