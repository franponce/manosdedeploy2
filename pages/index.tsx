import { GetStaticProps } from 'next';
import { Product } from '../product/types';
import api from '../product/api';
import StoreScreen from '../product/screens/Store';
import { getSiteInformation, SiteInformation } from '../utils/siteInfo';

interface Props {
  products: Product[];
}

const IndexRoute: React.FC<Props> = ({ products }) => {
  return <StoreScreen products={products} />;
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const products = await api.list();
    
    // Aunque ya no pasamos siteInfo a StoreScreen, aún podríamos necesitarla
    // para el layout general o para metadatos de la página
    const siteInfo = await getSiteInformation();

    return {
      props: {
        products,
      },
      revalidate: 60, // Revalidar cada minuto
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        products: [],
      },
      revalidate: 60,
    };
  }
};

export default IndexRoute;