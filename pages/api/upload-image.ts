// pages/api/upload-image.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';
import multer from 'multer';
import { promisify } from 'util';

// Configuración de multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limitar el tamaño del archivo a 5MB
  },
});

// Función para manejar la carga de archivos
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Ejecutar el middleware de multer
      await runMiddleware(req, res, upload.single('image'));

      const file = (req as any).file;
      const imageType = (req as any).body.type;

      if (!file || !imageType) {
        return res.status(400).json({ error: 'Missing file or image type' });
      }

      const base64Image = file.buffer.toString('base64');

      // Obtener la información del sitio actual
      let siteInfo: any = await kv.get('site_information') || {};

      // Actualizar la URL de la imagen correspondiente
      if (imageType === 'logo') {
        siteInfo.logoUrl = `data:${file.mimetype};base64,${base64Image}`;
      } else if (imageType === 'banner') {
        siteInfo.bannerUrl = `data:${file.mimetype};base64,${base64Image}`;
      }

      // Guardar la información actualizada
      await kv.set('site_information', siteInfo);

      res.status(200).json({ 
        message: 'Image uploaded successfully',
        url: imageType === 'logo' ? siteInfo.logoUrl : siteInfo.bannerUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Error uploading image' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}