import { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../utils/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de producto inválido' });
  }

  switch (req.method) {
    case 'DELETE':
      try {
        await productService.deleteProduct(id);
        return res.status(200).json({ message: 'Producto eliminado correctamente' });
      } catch (error) {
        console.error('Error eliminando producto:', error);
        return res.status(500).json({ error: 'Error al eliminar producto' });
      }

    case 'PATCH':
      try {
        const { isVisible } = req.body;
        const result = await productService.toggleVisibility(id, isVisible);
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error actualizando visibilidad:', error);
        return res.status(500).json({ error: 'Error al actualizar visibilidad' });
      }

    default:
      return res.status(405).json({ error: 'Método no permitido' });
  }
}