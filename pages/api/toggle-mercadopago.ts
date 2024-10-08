import { NextApiRequest, NextApiResponse } from "next";

const updateVercelEnv = async (key: string, value: string) => {
  // Primero, intentamos obtener la variable existente
  const getResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env?key=${key}`, {
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
    },
  });

  if (getResponse.status === 200) {
    // La variable existe, actualizamos su valor
    const { envs } = await getResponse.json();
    const envId = envs[0].id;
    const updateResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env/${envId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value,
        type: 'plain',
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update environment variable: ${errorData.error?.message || 'Unknown error'}`);
    }
  } else if (getResponse.status === 404) {
    // La variable no existe, la creamos
    const createResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env`, {
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

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create environment variable: ${errorData.error?.message || 'Unknown error'}`);
    }
  } else {
    throw new Error(`Unexpected response when checking for existing variable: ${getResponse.status}`);
  }

  return { success: true };
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
    } catch (error) {
      console.error("Error toggling MercadoPago:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}