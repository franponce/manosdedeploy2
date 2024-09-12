import fs from "fs";
import path from "path";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { enabled } = req.body;

      // Update the .env.local file
      const envFilePath = path.resolve(process.cwd(), ".env.local");
      let envContent = fs.readFileSync(envFilePath, "utf8");

      const regex = /MERCADO_PAGO_ENABLED=.*/;

      if (regex.test(envContent)) {
        envContent = envContent.replace(
          regex,
          `MERCADO_PAGO_ENABLED=${enabled}`
        );
      } else {
        envContent += `\nMERCADO_PAGO_ENABLED=${enabled}`;
      }

      fs.writeFileSync(envFilePath, envContent);

      // Update the process.env
      process.env.MERCADO_PAGO_ENABLED = enabled.toString();

      res.status(200).json({ enabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle MercadoPago" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
