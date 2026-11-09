import ParliamentarianDirectory from '@/components/political/ParliamentarianDirectory';

export const metadata = {
  title: 'Βουλευτές | Appofasi',
  description: 'Αναζητήστε τους βουλευτές ανά κόμμα και εκλογική περιφέρεια.',
};

export default function ParliamentariansPage() {
  return <ParliamentarianDirectory />;
}
