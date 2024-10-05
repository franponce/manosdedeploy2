import { GetStaticProps } from 'next';
import { Product } from '../product/types';
import api from '../product/api';
import StoreScreen from '../product/screens/Store';
import { getSiteInformation, SiteInformation } from '../utils/firebase';

interface IndexRouteProps {
  initialProducts: Product[];
}

const IndexRoute: React.FC<IndexRouteProps> = ({ initialProducts }) => {
  return <StoreScreen initialProducts={initialProducts} />;
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const products = await api.list();
    const siteInfo = await getSiteInformation();

    return {
      props: {
        initialProducts: products,
      },
      revalidate: 60, // Revalidar cada minuto
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        initialProducts: [],
      },
      revalidate: 60,
    };
  }
};

export default IndexRoute;