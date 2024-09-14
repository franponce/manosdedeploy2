import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Intentar obtener de la caché en memoria primero
      if (global.customScripts) {
        return res.status(200).json({ scripts: global.customScripts })
      }
      
      // Si no está en caché, obtener de la variable de entorno
      const scripts = process.env.CUSTOM_SCRIPTS || '';
      
      // Actualizar la caché en memoria
      global.customScripts = scripts;
      
      res.status(200).json({ scripts })
    } catch (error: unknown) {
      console.error('Error fetching scripts:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: 'Failed to fetch scripts', details: error.message })
      } else {
        res.status(500).json({ error: 'Failed to fetch scripts', details: 'An unknown error occurred' })
      }
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}