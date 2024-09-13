import { NextApiRequest, NextApiResponse } from 'next';
import { DEFAULT_SITE_INFORMATION, SiteInformation, getSiteInformation } from '../../utils/siteInfo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const siteInfo = getSiteInformation();
      res.status(200).json(siteInfo);
    } catch (error) {
      console.error('Error fetching site information:', error);
      res.status(500).json({ error: 'Failed to fetch site information' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}