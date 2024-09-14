import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  Stack,
  Text,
  Box,
  Heading,
} from "@chakra-ui/react";
import { CartItem, Product } from "../types";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { editCart } from "../selectors";
import { parseCurrency } from "../../utils/currency";
import { SiteInformation } from "../../utils/siteInfo";

interface Props {
  products: Product[];
  siteInfo: SiteInformation;
}

const StoreScreen: React.FC<Props> = ({ products, siteInfo }) => {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, toggleCart] = React.useState<boolean>(false);

  const total = React.useMemo(
    () => parseCurrency(cart.reduce((total, product) => total + product.price * product.quantity, 0)),
    [cart]
  );

  const quantity = React.useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    setCart(editCart(product, action));
  }

  // Filtrar productos inválidos
  const validProducts = products.filter(product => 
    product && product.id && product.title && product.image && product.price
  );

  return (
    <>
      <Stack spacing={6}>
        <Box>
          <Heading as="h1" size="xl" mb={2}>{siteInfo.title}</Heading>
          <Text fontSize="lg" mb={4}>{siteInfo.description}</Text>
          <Text fontSize="md" mb={6}>{siteInfo.description2}</Text>
        </Box>
        {validProducts.length ? (
          <Grid
            gridGap={8}
            templateColumns={{
              base: "repeat(auto-fill, minmax(240px, 1fr))",
              sm: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {validProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={(product) => handleEditCart(product, "increment")}
              />
            ))}
          </Grid>
        ) : (
          <Text color="gray.500" fontSize="lg" margin="auto">
            No hay productos cargados todavía, esperemos que pronto :/
          </Text>
        )}
        {Boolean(cart.length) && (
          <Flex alignItems="center" bottom={4} justifyContent="center" position="sticky">
            <Button
              boxShadow="xl"
              colorScheme="primary"
              data-testid="show-cart"
              size="lg"
              width={{ base: "100%", sm: "fit-content" }}
              onClick={() => toggleCart(true)}
            >
              <Stack alignItems="center" direction="row" spacing={6}>
                <Stack alignItems="center" direction="row" spacing={3}>
                  <Text fontSize="md" lineHeight={6}>
                    Ver carrito
                  </Text>
                  <Text
                    backgroundColor="rgba(0,0,0,0.25)"
                    borderRadius="sm"
                    color="gray.100"
                    fontSize="xs"
                    fontWeight="500"
                    paddingX={2}
                    paddingY={1}
                  >
                    {quantity} items
                  </Text>
                </Stack>
                <Text fontSize="md" lineHeight={6}>
                  {total}
                </Text>
              </Stack>
            </Button>
          </Flex>
        )}
      </Stack>
      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => toggleCart(false)}
        onDecrement={(product) => handleEditCart(product, "decrement")}
        onIncrement={(product) => handleEditCart(product, "increment")}
      />
    </>
  );
};

export default StoreScreen;