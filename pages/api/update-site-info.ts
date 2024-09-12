import fs from "fs";
import path from "path";

import { NextApiRequest, NextApiResponse } from "next";

const CONFIG_FILE = path.join(process.cwd(), "app", "constants.ts");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const newInfo = req.body;

      // Leer el archivo actual
      let content = fs.readFileSync(CONFIG_FILE, "utf8");

      // Actualizar el contenido
      content = `export const INFORMATION = ${JSON.stringify(
        newInfo,
        null,
        2
      )};\n`;

      // Escribir el nuevo contenido en el archivo
      fs.writeFileSync(CONFIG_FILE, content);

      res
        .status(200)
        .json({ message: "Site information updated successfully" });
    } catch (error) {
      console.error("Error updating site information:", error);
      res.status(500).json({ error: "Failed to update site information" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
