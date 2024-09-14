import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '../../lib/kv'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { scripts } = req.body
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await kv.set('custom_scripts', scripts)
        res.status(200).json({ message: 'Scripts updated successfully' })
      } else {
        console.warn('Vercel KV is not configured. Scripts not saved.')
        res.status(200).json({ message: 'Vercel KV not configured, scripts not saved' })
      }
    } catch (error: unknown) {
      console.error('Error updating scripts:', error)
      res.status(500).json({ error: 'Failed to update scripts', details: error instanceof Error ? error.message : 'Unknown error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}