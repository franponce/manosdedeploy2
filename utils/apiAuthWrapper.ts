import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

export const withAuth = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Tu lógica de autenticación aquí
      return await handler(req, res);
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'No autorizado' });
    }
  };
};