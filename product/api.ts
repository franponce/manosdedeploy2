import axios from "axios";
import Papa from "papaparse";

import { INFORMATION } from "../app/constants";
import { Product } from "./types";

const parseProducts = (data: any[]): Product[] => {
  return data.map((product) => ({
    ...product,
    price: Number(product.price),
    isScheduled: product.isScheduled === 'TRUE',
    scheduledPublishDate: product.scheduledPublishDate ? new Date(product.scheduledPublishDate) : null,
  }));
};

const api = {
  list: async (): Promise<Product[]> => {
    return axios
      .get(INFORMATION.sheet, {
        responseType: "blob",
      })
      .then(
        (response) =>
          new Promise<Product[]>((resolve, reject) => {
            Papa.parse(response.data, {
              header: true,
              complete: (results) => {
                const products = parseProducts(results.data);
                return resolve(products);
              },
              error: (error) => reject(error.message),
            });
          })
      );
  },
  mock: {
    list: async (mock: string): Promise<Product[]> => {
      const allProducts = await api.list();

      // Aquí puedes implementar la lógica para filtrar o modificar los productos
      // basándote en el valor de 'mock'
      switch (mock.toLowerCase()) {
        case "populares":
          // Por ejemplo, devuelve los 5 productos más caros
          return allProducts.sort((a, b) => b.price - a.price).slice(0, 5);
        case "nuevos":
          // Por ejemplo, devuelve los últimos 5 productos
          return allProducts.slice(-5);
        default:
          // Si no hay un mock específico, devuelve todos los productos
          return allProducts;
      }
    },
  },
};

export default api;
