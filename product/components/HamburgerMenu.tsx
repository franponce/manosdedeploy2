import React from 'react';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
  Box,
} from "@chakra-ui/react";
import NextLink from "next/link";

interface HamburgerMenuProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  onLogout: () => void;
}

const HamburgerIcon = () => (
  <Flex flexDirection="column" justifyContent="space-between" height="24px" width="24px">
    <Box bg="currentColor" h="2px" w="24px" />
    <Box bg="currentColor" h="2px" w="24px" />
    <Box bg="currentColor" h="2px" w="24px" />
  </Flex>
);

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isLoggedIn, isAdmin, onLogout }) => {
  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Options"
        icon={<HamburgerIcon />}
        variant="outline"
      />
      <MenuList>
        {isLoggedIn ? (
          <>
            <NextLink href="/admin" passHref legacyBehavior>
              <MenuItem as="a">Panel Administrador</MenuItem>
            </NextLink>
            <NextLink href="/store-config" passHref legacyBehavior>
              <MenuItem as="a">Configuración de la tienda</MenuItem>
            </NextLink>
            <NextLink href="/diseno" passHref legacyBehavior>
              <MenuItem as="a">Diseño</MenuItem>
            </NextLink>
            <MenuItem onClick={onLogout}>Cerrar sesión</MenuItem>
          </>
        ) : (
          <NextLink href="/login" passHref legacyBehavior>
            <MenuItem as="a">Iniciar Sesión</MenuItem>
          </NextLink>
        )}
      </MenuList>
    </Menu>
  );
};

export default HamburgerMenu;