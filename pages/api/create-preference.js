import mercadopago from '../../config/mercadopago';

const isTestMode = process.env.NODE_ENV !== 'production';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      console.log('Received request body:', req.body);
      const preference = {
        items: req.body.items,
        back_urls: req.body.back_urls,
        auto_return: req.body.auto_return,
      };

      if (isTestMode) {
        // Agregar datos de prueba
        preference.payer = {
          email: 'test_user_123456@testuser.com',
        };
      }

      console.log('Creating preference:', preference);
      const response = await mercadopago.preferences.create(preference);
      console.log('MercadoPago Response:', response);

      res.status(200).json({
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point,
        preference_id: response.body.id,
      });
    } catch (error) {
      console.error('Error in create-preference:', error);
      res.status(500).json({
        error: 'Error creating MercadoPago preference',
        details: error.message,
        stack: error.stack,
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}