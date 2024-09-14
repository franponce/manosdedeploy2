import type { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '../../lib/kv'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { scripts } = req.body
      await kv.set('custom_scripts', scripts)
      res.status(200).json({ message: 'Scripts updated successfully' })
    } catch (error: unknown) {
      console.error('Error updating scripts:', error)
      if (error instanceof Error) {
        res.status(500).json({ error: 'Failed to update scripts', details: error.message })
      } else {
        res.status(500).json({ error: 'Failed to update scripts', details: 'An unknown error occurred' })
      }
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}