import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    console.log('Iniciando operación de debug KV');
    try {
      console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL ? 'Definido' : 'No definido');
      console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN ? 'Definido' : 'No definido');

      await kv.set('test_key', 'test_value');
      console.log('Operación de escritura completada');
      
      const value = await kv.get('test_key');
      console.log('Valor leído:', value);

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
    console.log(`Método no permitido: ${req.method}`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}