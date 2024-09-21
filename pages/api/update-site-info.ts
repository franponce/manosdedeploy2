import { NextApiRequest, NextApiResponse } from 'next';
import { updateSiteInformation, SiteInformation } from '../../utils/siteInfo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log('Recibida solicitud POST para actualizar información del sitio');
    try {
      const newInfo: Partial<SiteInformation> = req.body;
      console.log('Nueva información recibida:', newInfo);
      await updateSiteInformation(newInfo);
      console.log('Información del sitio actualizada exitosamente');
      res.status(200).json({ message: 'Site information updated successfully' });
    } catch (error) {
      console.error('Error al actualizar la información del sitio:', error);
      res.status(500).json({ error: 'Failed to update site information', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    console.log(`Método no permitido: ${req.method}`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}