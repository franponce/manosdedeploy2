import { isServer } from '../utils';

export const makeRequest = async (url: string, options = {}) => {
  // Solo importar http2 en el servidor
  if (isServer()) {
    const http2 = await import('http2');
    // ... resto del código
  }
  
  // Usar fetch en el cliente
  return fetch(url, options);
}; 