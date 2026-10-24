import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { StaticPageLayout } from '@/components/layout';

export async function generateMetadata() {
  const t = await getTranslations('democracy');
  return {
    title: `${t('participationTitle')} | Appofasi`,
    description: t('meaning'),
    alternates: { canonical: '/platform/participation' },
  };
}

export default async function ParticipationPage() {
  const t = await getTranslations('democracy');
  return (
    <StaticPageLayout
      title={t('participationTitle')}
      showHelpfulLinks={false}
      breadcrumb={<Link href="/polls" className="text-gray-600 hover:underline">{t('backToPolls')}</Link>}
    >
      <section>
        <h2 className="text-xl font-semibold mb-3">{t('advisory')}</h2>
        <p>{t('meaning')}</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">{t('eligibilityTitle')}</h2>
        <ul className="list-disc pl-5 space-y-3">
          <li>{t('guestEligibility')}</li>
          <li>{t('accountEligibility')}</li>
          <li>{t('localEligibility')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">{t('privacyTitle')}</h2>
        <p>{t('privacy')}</p>
      </section>
    </StaticPageLayout>
  );
}
