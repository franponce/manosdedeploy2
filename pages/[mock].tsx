import * as React from "react";
import { GetStaticPaths, GetStaticProps } from "next";

import { Product, Category } from "../product/types";
import api from "../product/api";
import StoreScreen from "../product/screens/Store";
import { getSiteInformation, SiteInformation } from "../utils/firebase";

interface Props {
  initialProducts: Product[];
  initialCategories: Category[];
}

const MockRoute: React.FC<Props> = ({ initialProducts, initialCategories }) => {
  return <StoreScreen initialProducts={initialProducts} initialCategories={initialCategories} />;
};

export const getStaticProps: GetStaticProps = async (context) => {
  const mock = context.params?.mock as string;
  let products: Product[] = [];

  try {
    const fetchedProducts = await api.mock.list(mock);
    console.log('Productos obtenidos:', fetchedProducts); // Debug

    products = fetchedProducts.filter((product): product is Product =>
      Boolean(
        product &&
        typeof product === "object" &&
        product.id &&
        product.title &&
        product.description &&
        Array.isArray(product.images) &&
        typeof product.price === "number"
      )
    );

    console.log('Productos filtrados:', products); // Debug

    return {
      props: {
        initialProducts: products,
        initialCategories: [],
      },
      revalidate: 10,
    };
  } catch (error) {
    console.error(`Error en mock "${mock}":`, error);
    return {
      props: {
        initialProducts: [],
        initialCategories: [],
      },
      revalidate: 10,
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default MockRoute;
