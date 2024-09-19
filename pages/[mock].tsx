import * as React from "react";
import { GetStaticPaths, GetStaticProps } from "next";

import { Product } from "../product/types";
import api from "../product/api";
import StoreScreen from "../product/screens/Store";
import { SiteInformation, getSiteInformation } from "../utils/siteInfo";

interface Props {
  products: Product[];
}

const MockRoute: React.FC<Props> = ({ products }) => {
  return <StoreScreen products={products} />;
};

export const getStaticProps: GetStaticProps = async (context) => {
  const mock = context.params?.mock as string;
  let products: Product[] = [];
  let siteInfo: SiteInformation;

  try {
    const fetchedProducts = await api.mock.list(mock);

    // Filtrar productos inválidos o incompletos
    products = fetchedProducts.filter(
      (product): product is Product =>
        product !== null &&
        typeof product === "object" &&
        typeof product.id === "string" &&
        typeof product.title === "string" &&
        typeof product.description === "string" &&
        typeof product.image === "string" &&
        typeof product.price === "number"
    );

    // Obtener la información del sitio
    siteInfo = await getSiteInformation();
  } catch (error) {
    console.error(`Error fetching data for mock "${mock}":`, error);
    // En caso de error, devolvemos una lista vacía de productos y la información del sitio por defecto
    siteInfo = await getSiteInformation();
  }

  return {
    props: {
      products,
    },
    revalidate: 10,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default MockRoute;