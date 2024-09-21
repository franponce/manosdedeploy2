import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Imprimir las variables de entorno (¡ten cuidado de no exponer información sensible!)
      console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'Definido' : 'No definido');
      console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'Definido' : 'No definido');

      // Intentar una operación de escritura
      await kv.set('test_key', 'test_value');
      
      // Intentar una operación de lectura
      const value = await kv.get('test_key');

      res.status(200).json({ 
        message: 'Debug operación completada', 
        writeSuccess: true, 
        readValue: value 
      });
    } catch (error) {
      console.error('Error en operación de KV:', error);
      res.status(500).json({ 
        error: 'Error en operación de KV', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}