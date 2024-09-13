import { NextApiRequest, NextApiResponse } from "next";

const updateVercelEnv = async (key: string, value: string) => {
  const response = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      target: ['production', 'preview', 'development'],
      type: 'plain',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update environment variable: ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { enabled } = req.body;

      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "Invalid 'enabled' value. Must be a boolean." });
      }

      // Actualizar la variable de entorno en Vercel
      await updateVercelEnv('MERCADO_PAGO_ENABLED', enabled.toString());

      // Actualizar la variable de entorno en memoria para el proceso actual
      process.env.MERCADO_PAGO_ENABLED = enabled.toString();

      res.status(200).json({ enabled, message: "MercadoPago toggle updated successfully" });
    } catch (error: unknown) {
      console.error("Error toggling MercadoPago:", error);
      if (error instanceof Error) {
        res.status(500).json({ error: "Failed to toggle MercadoPago", details: error.message });
      } else {
        res.status(500).json({ error: "Failed to toggle MercadoPago", details: "An unknown error occurred" });
      }
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}