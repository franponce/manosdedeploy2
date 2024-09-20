import { NextApiRequest, NextApiResponse } from 'next';
import { updateSiteInformation, SiteInformation } from '../../utils/siteInfo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const newInfo: Partial<SiteInformation> = req.body;
      await updateSiteInformation(newInfo);
      res.status(200).json({ message: 'Site information updated successfully' });
    } catch (error) {
      console.error('Error updating site information:', error);
      res.status(500).json({ error: 'Failed to update site information', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}