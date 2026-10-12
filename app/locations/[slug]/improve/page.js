'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { locationAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import LocationImprovements from '@/components/locations/LocationImprovements';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import AlertMessage from '@/components/ui/AlertMessage';

export default function ImproveLocationPage() {
  const { slug } = useParams();
  const t = useTranslations('locationImprovements');
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const result = await locationAPI.getById(slug);
    if (!result.success) throw new Error(t('loadError'));
    return result.location;
  }, [slug]);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {error && <><AlertMessage message={t('loadError')} /><button onClick={refetch} className="mt-3 text-blue-700">{t('retry')}</button></>}
      {loading && !data ? <SkeletonLoader type="card" count={2} /> : data && <LocationImprovements key={data.id} location={data} onPublished={refetch} />}
    </div>
  );
}
