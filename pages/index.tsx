import { GetServerSideProps } from 'next';
import StoreScreen from '../product/screens/Store';
import { Product, Category } from '../product/types';
import { getProducts, getCategories } from '../utils/googleSheets';

interface HomeProps {
  products: Product[];
  categories: Category[];
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  try {
    const [products, categories] = await Promise.all([getProducts(), getCategories()]);
    return { props: { products, categories } };
  } catch (error) {
    console.error('Error fetching data:', error);
    return { props: { products: [], categories: [] } };
  }
};

const Home: React.FC<HomeProps> = ({ products, categories }) => {
  return <StoreScreen initialProducts={products} initialCategories={categories} />;
};

export default Home;
