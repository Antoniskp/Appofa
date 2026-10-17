import ArticlesPage from '../articles/page';

export const metadata = {
  title: 'Αναλύσεις | Appofasi',
  description: 'Αναλύσεις για την οικονομία και τα δημόσια προβλήματα, με πηγές και προτάσεις λύσεων.',
};

export default function AnalysesPage() {
  return <ArticlesPage defaultType="analysis" />;
}
