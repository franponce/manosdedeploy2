import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const scripts = process.env.CUSTOM_SCRIPTS || '';
      res.status(200).json({ scripts })
    } catch (error) {
      console.error('Error fetching scripts:', error);
      res.status(500).json({ error: 'Failed to fetch scripts' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}