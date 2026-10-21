import { pageMetadata } from '@/lib/seo';
import ArticlesPage from '../articles/page';

export const metadata = pageMetadata('Αναλύσεις', 'Αναλύσεις για την οικονομία και τα δημόσια προβλήματα, με πηγές και προτάσεις λύσεων.', '/analyses');

export default function AnalysesPage() {
  return <ArticlesPage defaultType="analysis" />;
}
