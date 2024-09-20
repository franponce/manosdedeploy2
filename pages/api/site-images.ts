// pages/api/site-images.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { kv } from '@vercel/kv';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const siteInfo = await kv.get('site_information') as any || {};
      
      res.status(200).json({
        logoUrl: siteInfo.logoUrl || '/default-logo.png',
        bannerUrl: siteInfo.bannerUrl || '/default-banner.jpg',
      });
    } catch (error) {
      console.error('Error fetching site images:', error);
      res.status(500).json({ error: 'Error fetching site images' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}