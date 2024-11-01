import { useRouter } from 'next/router';
import StoreScreen from '../product/screens/Store';

const StorePage: React.FC = () => {
  const router = useRouter();
  const isPreviewMode = router.query.preview === "true";

  return (
    <StoreScreen
      initialProducts={[]} // tus productos iniciales
      initialCategories={[]} // tus categorías iniciales
      isPreviewMode={isPreviewMode}
    />
  );
};

export default StorePage;
