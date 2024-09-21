import { GetStaticProps } from 'next';
import { Product } from '../product/types';
import api from '../product/api';
import StoreScreen from '../product/screens/Store';
import { getSiteInformation, SiteInformation } from '../utils/firebase';

interface Props {
  products: Product[];
  siteInfo: SiteInformation;
}

const IndexRoute: React.FC<Props> = ({ products, siteInfo }) => {
  return <StoreScreen products={products} siteInfo={siteInfo} />;
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    const [products, siteInfo] = await Promise.all([
      api.list(),
      getSiteInformation()
    ]);

    return {
      props: {
        products,
        siteInfo,
      },
      revalidate: 60, // Revalidar cada minuto
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        products: [],
        siteInfo: await getSiteInformation(),
      },
      revalidate: 60,
    };
  }
};

export default IndexRoute;