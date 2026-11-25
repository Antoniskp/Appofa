import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { StaticPageLayout } from '@/components/layout';

export async function generateMetadata() {
  const t = await getTranslations('democracy');
  return {
    title: t('participationTitle'),
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
      <section aria-labelledby="voting-integrity">
        <h2 id="voting-integrity" className="text-xl font-semibold mb-3">{t('integrityTitle')}</h2>
        <div className="space-y-3">
          <p>{t('integrityLimits')}</p>
          <p>{t('integrityRule')}</p>
          <p>{t('integrityReview')}</p>
          <Link href="/rules" className="text-teal-800 underline underline-offset-4">{t('integrityRulesLink')}</Link>
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">{t('privacyTitle')}</h2>
        <p>{t('privacy')}</p>
      </section>
    </StaticPageLayout>
  );
}
