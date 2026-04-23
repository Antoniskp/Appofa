import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export async function generateMetadata() {
  const tStatic = await getTranslations('static_pages');
  const title = tStatic('contribute_meta_title');
  const description = tStatic('contribute_meta_description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/contribute`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/contribute`,
    },
  };
}

export default async function ContributePage() {
  const tStatic = await getTranslations('static_pages');
  return (
    <StaticPageLayout title={tStatic('contribute_title')} breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← {tStatic('pages')}</Link>}>
      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('contribute_intro_title')}</h2>
        <p className="text-gray-700 mb-4">
          {tStatic('contribute_intro_body_1')}
        </p>
        <p className="text-gray-700">
          {tStatic('contribute_intro_body_2')}
        </p>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-3">{tStatic('contribute_connect_title')}</h2>
        <p className="text-gray-700 mb-6">
          {tStatic('contribute_connect_body')}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/contact" className="btn-primary">
            {tStatic('contribute_contact_cta')}
          </Link>
          <Link href="/mission" className="btn-secondary">
            {tStatic('contribute_vision_cta')}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('contribute_help_title')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_editorial_title')}</h3>
            <p className="text-gray-700">
              {tStatic('contribute_editorial_body')}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_engineering_title')}</h3>
            <p className="text-gray-700">
              {tStatic('contribute_engineering_body')}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_community_title')}</h3>
            <p className="text-gray-700">
              {tStatic('contribute_community_body')}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('contribute_finance_title')}</h2>
        <p className="text-gray-700 mb-6">
          {tStatic('contribute_finance_intro')}
        </p>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_donation_title')}</h3>
            <p className="text-gray-700">
              {tStatic('contribute_donation_body')}
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="https://www.buymeacoffee.com/Antoniskp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 text-sm font-bold rounded-md whitespace-nowrap bg-[#FFDD00] text-black transition-opacity hover:opacity-85"
              >
                ☕ Buy me a coffee
              </a>
              <a
                href="https://github.com/sponsors/Antoniskp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 text-sm font-bold rounded-md whitespace-nowrap bg-[#24292f] text-white border border-white/15 transition-opacity hover:opacity-85"
              >
                ❤️ Sponsor on GitHub
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_funding_title')}</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{tStatic('contribute_funding_1')}</li>
              <li>{tStatic('contribute_funding_2')}</li>
              <li>{tStatic('contribute_funding_3')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('contribute_needs_title')}</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_needs_data_title')}</h3>
            <p className="text-gray-700">
              {tStatic('contribute_needs_data_body')}
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{tStatic('contribute_needs_ux_title')}</h3>
            <p className="text-gray-700">
              {tStatic('contribute_needs_ux_body')}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('contribute_steps_title')}</h2>
        <ul className="list-disc pl-6 text-gray-700 space-y-3">
          <li>
            {tStatic('contribute_steps_1_prefix')}{' '}
            <a
              href="https://github.com/Antoniskp/Appofa/issues"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              {tStatic('contribute_steps_1_link')}
            </a>
            {tStatic('contribute_steps_1_suffix')}
          </li>
          <li>{tStatic('contribute_steps_2')}</li>
          <li>
            {tStatic('contribute_steps_3_prefix')}{' '}
            <a
              href="https://github.com/Antoniskp/Appofa"
              className="text-blue-600 hover:text-blue-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              {tStatic('contribute_steps_3_link')}
            </a>
            {tStatic('contribute_steps_3_suffix')}
          </li>
          <li>
            {tStatic('contribute_steps_4')}
          </li>
        </ul>
      </section>
    </StaticPageLayout>
  );
}
