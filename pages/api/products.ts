import { NextApiRequest, NextApiResponse } from "next";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCount,
} from "../../utils/googleSheets";

const PRODUCT_LIMIT = 30;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET":
        const products = await getProducts();

        res.status(200).json(products);
        break;

      case "POST":
        const product = req.body;

        if (product.id) {
          const updatedProduct = await updateProduct(product);

          res.status(200).json(updatedProduct);
        } else {
          const productCount = await getProductCount();

          if (productCount >= PRODUCT_LIMIT) {
            res.status(400).json({
              message: `Product limit of ${PRODUCT_LIMIT} reached. Unable to add more products.`,
            });
          } else {
            const newProduct = await createProduct(product);

            res.status(201).json(newProduct);
          }
        }
        break;

      case "DELETE":
        const { id } = req.query;

        if (typeof id !== "string") {
          res.status(400).json({ message: "Invalid product ID" });

          return;
        }
        await deleteProduct(id);
        res.status(200).json({ message: "Product deleted successfully" });
        break;

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}
