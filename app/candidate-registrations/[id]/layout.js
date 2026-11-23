import { getTranslations } from 'next-intl/server';
import { MetadataLayout } from '@/lib/route-metadata';

export async function generateMetadata({ params }) {
  const [{ id }, t] = await Promise.all([params, getTranslations('onboarding')]);
  return { title: `${t('step_candidate_register')} #${id}` };
}

export default MetadataLayout;
