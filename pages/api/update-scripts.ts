import type { NextApiRequest, NextApiResponse } from 'next'

const updateVercelEnv = async (key: string, value: string) => {
  const response = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      target: ['production', 'preview', 'development'],
      type: 'plain',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to update environment variable: ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { scripts } = req.body
      await updateVercelEnv('CUSTOM_SCRIPTS', scripts);
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