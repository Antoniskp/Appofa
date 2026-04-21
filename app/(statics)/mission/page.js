import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export async function generateMetadata() {
  const tStatic = await getTranslations('static_pages');
  const title = tStatic('mission_meta_title');
  const description = tStatic('mission_meta_description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/mission`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/mission`,
    },
  };
}

export default async function MissionPage() {
  const tStatic = await getTranslations('static_pages');
  return (
    <StaticPageLayout title={tStatic('mission_title')} breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">← {tStatic('pages')}</Link>}>
      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('mission_goal_title')}</h2>
        <p className="text-gray-700 mb-4">
          {tStatic('mission_goal_intro')}
        </p>
        <p className="text-gray-700">
          {tStatic('mission_goal_body')}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('mission_no_parties_title')}</h2>
        <p className="text-gray-700">
          {tStatic('mission_no_parties_body')}
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">{tStatic('mission_legal_reset_title')}</h2>
        <p className="text-gray-700">
          {tStatic('mission_legal_reset_body')}
        </p>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-3">{tStatic('mission_principles_title')}</h2>
          <p className="text-gray-700">
            {tStatic('mission_principles_intro')}
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_transparency_title')}</h3>
          <p className="text-gray-700 mb-3">
            {tStatic('mission_transparency_intro')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('mission_transparency_point_1')}</li>
            <li>{tStatic('mission_transparency_point_2')}</li>
            <li>{tStatic('mission_transparency_point_3')}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_sentiment_title')}</h3>
          <p className="text-gray-700 mb-3">
            {tStatic('mission_sentiment_intro')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('mission_sentiment_point_1')}</li>
            <li>{tStatic('mission_sentiment_point_2')}</li>
            <li>{tStatic('mission_sentiment_point_3')}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_greece_title')}</h3>
          <p className="text-gray-700 mb-3">
            {tStatic('mission_greece_intro')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('mission_greece_point_1')}</li>
            <li>{tStatic('mission_greece_point_2')}</li>
            <li>{tStatic('mission_greece_point_3')}</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_models_title')}</h3>
          <p className="text-gray-700">
              {tStatic('mission_models_intro')}
            </p>
          </div>

          <div className="space-y-4">
          <h4 className="text-lg font-semibold">{tStatic('mission_direct_democracy_title')}</h4>
          <p className="text-gray-700">
              {tStatic('mission_direct_democracy_intro')}
            </p>
          <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800 mb-2">{tStatic('mission_direct_democracy_offers_title')}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic('mission_direct_democracy_offer_1')}</li>
                  <li>{tStatic('mission_direct_democracy_offer_2')}</li>
                  <li>{tStatic('mission_direct_democracy_offer_3')}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-2">{tStatic('mission_direct_democracy_attention_title')}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic('mission_direct_democracy_attention_1')}</li>
                  <li>{tStatic('mission_direct_democracy_attention_2')}</li>
                  <li>{tStatic('mission_direct_democracy_attention_3')}</li>
                </ul>
              </div>
          </div>
          </div>

          <div className="space-y-4">
          <h4 className="text-lg font-semibold">{tStatic('mission_digital_democracy_title')}</h4>
          <p className="text-gray-700">
              {tStatic('mission_digital_democracy_intro')}
            </p>
          <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800 mb-2">{tStatic('mission_digital_democracy_offers_title')}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic('mission_digital_democracy_offer_1')}</li>
                  <li>{tStatic('mission_digital_democracy_offer_2')}</li>
                  <li>{tStatic('mission_digital_democracy_offer_3')}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 mb-2">{tStatic('mission_digital_democracy_attention_title')}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic('mission_digital_democracy_attention_1')}</li>
                  <li>{tStatic('mission_digital_democracy_attention_2')}</li>
                  <li>{tStatic('mission_digital_democracy_attention_3')}</li>
                </ul>
              </div>
          </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_dream_team_title')}</h3>
          <p className="text-gray-700">
            {tStatic('mission_dream_team_body')}
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_token_title')}</h3>
          <p className="text-gray-700">
            {tStatic('mission_token_body')}
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_token_principles_title')}</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('mission_token_principles_1')}</li>
            <li>{tStatic('mission_token_principles_2')}</li>
            <li>{tStatic('mission_token_principles_3')}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_gamification_title')}</h3>
          <p className="text-gray-700 mb-3">
            {tStatic('mission_gamification_intro')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('mission_gamification_1')}</li>
            <li>{tStatic('mission_gamification_2')}</li>
            <li>{tStatic('mission_gamification_3')}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">{tStatic('mission_success_title')}</h3>
          <p className="text-gray-700 mb-3">
            {tStatic('mission_success_intro')}
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>{tStatic('mission_success_1')}</li>
            <li>{tStatic('mission_success_2')}</li>
            <li>{tStatic('mission_success_3')}</li>
          </ul>
        </div>
      </section>
    </StaticPageLayout>
  );
}
