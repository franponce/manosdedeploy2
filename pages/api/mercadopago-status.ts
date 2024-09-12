import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      // Aquí deberías obtener el estado real de una base de datos o archivo de configuración
      const isMercadoPagoEnabled = process.env.MERCADO_PAGO_ENABLED === "true";

      res.status(200).json({ enabled: isMercadoPagoEnabled });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MercadoPago status" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
