import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Aquí deberías obtener los métodos de pago desde tu base de datos o archivo de configuración
      const paymentMethods = {
        mercadoPago: process.env.MERCADO_PAGO_ENABLED === 'true',
        cashOnPickup: true,
        cashOnDelivery: true,
        bankTransfer: true,
      };
      res.status(200).json(paymentMethods);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}