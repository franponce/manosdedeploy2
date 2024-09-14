import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { scripts } = req.body
      const filePath = path.join(process.cwd(), 'custom-scripts.js')
      
      fs.writeFileSync(filePath, scripts)
      
      res.status(200).json({ message: 'Scripts updated successfully' })
    } catch (error) {
      console.error('Error updating scripts:', error);
      res.status(500).json({ error: 'Failed to update scripts' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}