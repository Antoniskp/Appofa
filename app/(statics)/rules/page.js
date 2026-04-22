import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export async function generateMetadata() {
  const tStatic = await getTranslations('static_pages');
  const tCommon = await getTranslations('common');
  const title = `${tStatic('rules_title')} - ${tCommon('app_name')}`;
  const description = tStatic('rules_meta_description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/rules`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/rules`,
    },
  };
}

export default async function RulesPage() {
  const tStatic = await getTranslations('static_pages');
  return (
    <StaticPageLayout title={tStatic('rules_title')} maxWidth="max-w-3xl" breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← {tStatic('pages')}</Link>}>
      <p className="text-gray-700 mb-6">
        {tStatic('rules_intro')}
      </p>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-3">{tStatic('rules_section_title')}</h2>
          <p className="text-gray-700 mb-3">
            {tStatic('rules_section_description')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('rules_forbidden_1')}</li>
            <li>{tStatic('rules_forbidden_2')}</li>
            <li>{tStatic('rules_forbidden_3')}</li>
            <li>{tStatic('rules_forbidden_4')}</li>
            <li>{tStatic('rules_forbidden_5')}</li>
            <li>{tStatic('rules_forbidden_6')}</li>
            <li>{tStatic('rules_forbidden_7')}</li>
            <li>{tStatic('rules_forbidden_8')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">{tStatic('rules_encourage_title')}</h2>
          <p className="text-gray-700 mb-3">
            {tStatic('rules_encourage_description')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('rules_encourage_1')}</li>
            <li>{tStatic('rules_encourage_2')}</li>
            <li>{tStatic('rules_encourage_3')}</li>
            <li>{tStatic('rules_encourage_4')}</li>
            <li>{tStatic('rules_encourage_5')}</li>
            <li>{tStatic('rules_encourage_6')}</li>
            <li>{tStatic('rules_encourage_7')}</li>
            <li>{tStatic('rules_encourage_8')}</li>
          </ul>
        </div>
      </div>
    </StaticPageLayout>
  );
}
