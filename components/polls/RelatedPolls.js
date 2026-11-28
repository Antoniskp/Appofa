'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { pollAPI } from '@/lib/api/polls';
import { fetchRelatedPolls } from '@/lib/utils/relatedArticles';
import PollCard from './PollCard';

/**
 * Related polls block. `source` may be a poll or an article; set
 * `excludeSelf` to false when the source is not a poll.
 */
export default function RelatedPolls({ source, limit = 4, excludeSelf = true }) {
  const t = useTranslations('polls');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    fetchRelatedPolls(source, pollAPI.getAll, { limit, excludeId: excludeSelf ? source.id : null })
      .then((polls) => {
        if (active) setResult({ source, polls });
      });
    return () => { active = false; };
  }, [source, limit, excludeSelf]);

  const polls = result?.source === source ? result.polls : [];
  if (!polls.length) return null;

  return (
    <section aria-labelledby="related-polls-heading" className="my-10 border-t border-gray-200 pt-8 print:hidden">
      <div className="mb-6">
        <h2 id="related-polls-heading" className="text-2xl font-bold text-gray-900">{t('related_polls')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('related_polls_description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {polls.map((related) => <PollCard key={related.id} poll={related} />)}
      </div>
    </section>
  );
}
