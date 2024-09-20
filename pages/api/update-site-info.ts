import { NextApiRequest, NextApiResponse } from 'next';
import { updateSiteInformation } from '../../utils/siteInfo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await updateSiteInformation(req.body);
      res.status(200).json({ message: 'Site information updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update site information' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}