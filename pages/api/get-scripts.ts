import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '../../lib/kv'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const scripts = await kv.get('custom_scripts') || ''
      res.status(200).json({ scripts })
    } catch (error: unknown) {
      console.error('Error fetching scripts:', error)
      if (error instanceof Error) {
        res.status(500).json({ error: 'Failed to fetch scripts', details: error.message })
      } else {
        res.status(500).json({ error: 'Failed to fetch scripts', details: 'An unknown error occurred' })
      }
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}