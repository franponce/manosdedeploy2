import { NextApiRequest, NextApiResponse } from 'next';
import { auth } from './firebase';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

// Importamos la función correcta para verificar el token ID
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Extender el tipo NextApiRequest para incluir el uid
declare module 'next' {
  interface NextApiRequest {
    uid?: string;
  }
}

// Inicializar Firebase Admin si aún no está inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminAuth = getAdminAuth();

export function withAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authToken = req.cookies.authToken;

      if (!authToken) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      if (authToken === 'admin-token') {
        // El usuario es admin
        req.uid = 'admin';
        return handler(req, res);
      }

      try {
        const decodedToken = await adminAuth.verifyIdToken(authToken);
        req.uid = decodedToken.uid;
      } catch (error) {
        console.error('Error al verificar el token:', error);
        return res.status(401).json({ error: 'Token inválido' });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Error de autenticación:', error);
      return res.status(401).json({ error: 'No autorizado' });
    }
  };
}

export function withAdminAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authToken = req.cookies.authToken;

      if (!authToken) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      if (authToken === 'admin-token') {
        req.uid = 'admin';
        return handler(req, res);
      }

      return res.status(403).json({ error: 'Acceso denegado' });
    } catch (error) {
      console.error('Error de autenticación:', error);
      return res.status(401).json({ error: 'No autorizado' });
    }
  };
}