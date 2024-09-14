import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const filePath = path.join(process.cwd(), 'custom-scripts.js')
      
      if (fs.existsSync(filePath)) {
        const scripts = fs.readFileSync(filePath, 'utf-8')
        res.status(200).json({ scripts })
      } else {
        res.status(200).json({ scripts: '' })
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      res.status(500).json({ error: 'Failed to fetch scripts' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}