'use client';

import { homepageAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import HomepageSection from '@/components/HomepageSection';
import ArticleCard from '@/components/articles/ArticleCard';
import PollCard from '@/components/polls/PollCard';
import SuggestionCard from '@/components/SuggestionCard';

const sections = ['latestNews', 'latestArticles', 'suggestions', 'polls'];

export default function LocalActivity({ locationId, locationHref }) {
  const { data, loading, error, refetch } = useAsyncData(async () => {
    const response = await homepageAPI.get(locationId, sections);
    if (!response?.success) throw new Error('Local activity unavailable');
    return response;
  }, [locationId]);
  const items = sections.flatMap(section => (data?.data?.[section] || []).map(item => ({ section, item })))
    .sort((a, b) => new Date(b.item.newsApprovedAt || b.item.createdAt || 0) - new Date(a.item.newsApprovedAt || a.item.createdAt || 0))
    .slice(0, 6);

  return <HomepageSection
    title="Στην περιοχή σου"
    subtitle="Πρόσφατες ειδήσεις, προτάσεις και ψηφοφορίες από την περιοχή σου."
    linkHref={locationHref}
    loading={loading}
    error={Boolean(error) || sections.some(section => data?.errors?.[section])}
    onRetry={() => refetch()}
    items={items}
    emptyTitle="Δεν υπάρχουν ακόμη θέματα στην περιοχή σου"
    emptyDescription="Επισκέψου τη σελίδα της περιοχής σου για να καταθέσεις την πρώτη πρόταση."
    renderItem={({ section, item }) => section === 'suggestions'
      ? <SuggestionCard key={`${section}-${item.id}`} suggestion={item} />
      : section === 'polls'
        ? <PollCard key={`${section}-${item.id}`} poll={item} variant="grid" />
        : <ArticleCard key={`${section}-${item.id}`} article={item} variant="grid" tagLinkPrefix={section === 'latestNews' ? '/news' : '/articles'} />}
  />;
}
