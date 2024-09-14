import { NextApiRequest, NextApiResponse } from 'next';
import { DEFAULT_SITE_INFORMATION, SiteInformation } from '../../utils/siteInfo';

let siteInfo: SiteInformation = { ...DEFAULT_SITE_INFORMATION };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(siteInfo);
  } else if (req.method === 'POST') {
    try {
      const newInfo = req.body;
      siteInfo = { ...siteInfo, ...newInfo };
      res.status(200).json({ message: 'Site information updated successfully' });
    } catch (error) {
      console.error('Error updating site information:', error);
      res.status(500).json({ error: 'Failed to update site information' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}