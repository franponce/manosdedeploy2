import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '../../lib/kv'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      let scripts = ''
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        scripts = await kv.get('custom_scripts') || ''
      } else {
        console.warn('Vercel KV is not configured. Using empty scripts.')
      }
      res.status(200).json({ scripts })
    } catch (error: unknown) {
      console.error('Error fetching scripts:', error)
      res.status(500).json({ error: 'Failed to fetch scripts', details: error instanceof Error ? error.message : 'Unknown error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}