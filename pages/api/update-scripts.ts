import type { NextApiRequest, NextApiResponse } from 'next'

const updateVercelEnv = async (key: string, value: string) => {
  // Primero, intentamos obtener la variable existente
  const getResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env?key=${key}`, {
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
    },
  });

  if (getResponse.status === 200) {
    // La variable existe, actualizamos su valor
    const { envs } = await getResponse.json();
    const envId = envs[0].id;
    const updateResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env/${envId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value,
        type: 'plain',
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Failed to update environment variable: ${errorData.error?.message || 'Unknown error'}`);
    }
  } else if (getResponse.status === 404) {
    // La variable no existe, la creamos
    const createResponse = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/env`, {
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

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create environment variable: ${errorData.error?.message || 'Unknown error'}`);
    }
  } else {
    throw new Error(`Unexpected response when checking for existing variable: ${getResponse.status}`);
  }

  return { success: true };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { scripts } = req.body
      await updateVercelEnv('CUSTOM_SCRIPTS', scripts);
      res.status(200).json({ message: 'Scripts updated successfully' })
    } catch (error: unknown) {
      console.error('Error updating scripts:', error);
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