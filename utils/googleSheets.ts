import { Product } from '../product/types';

let googleSheetsModule: typeof import('../utils/googleSheetsServer');

async function getGoogleSheetsModule() {
  if (typeof window === 'undefined') {
    // Estamos en el servidor
    googleSheetsModule = await import('../utils/googleSheetsServer');
  }
  return googleSheetsModule;
}

export async function getProducts(): Promise<Product[]> {
  const module = await getGoogleSheetsModule();
  return module.getProducts();
}

export async function updateProduct(product: Product): Promise<void> {
  const module = await getGoogleSheetsModule();
  return module.updateProduct(product);
}

export async function createProduct(product: Product): Promise<string> {
  const module = await getGoogleSheetsModule();
  return module.createProduct(product);
}

export async function deleteProduct(id: string): Promise<void> {
  const module = await getGoogleSheetsModule();
  return module.deleteProduct(id);
}

export async function getProductCount(): Promise<number> {
  const module = await getGoogleSheetsModule();
  return module.getProductCount();
}