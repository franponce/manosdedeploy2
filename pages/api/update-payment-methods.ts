import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const updatedMethods = req.body;
      // Aquí deberías guardar los métodos de pago actualizados en tu base de datos o archivo de configuración
      // Por ahora, simplemente devolveremos los métodos actualizados
      res.status(200).json(updatedMethods);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update payment methods' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}