import { useTranslations } from 'next-intl';

export default function PolicyExplanation({ policy }) {
  const t = useTranslations('positions');
  const category = policy.position?.category;
  const key = category ? 'categories.' + category.slug : null;
  return <details className="mt-3 text-sm">
    <summary className="cursor-pointer font-medium text-blue-700">{t('explain')}</summary>
    <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
      {policy.explanation ? <p className="whitespace-pre-line">{policy.explanation}</p> : <>
        {category && <p>{t('explanation_context', { category: t.has(key) ? t(key) : category.name })}</p>}
        <p className="whitespace-pre-line">{policy.body}</p>
      </>}
    </div>
  </details>;
}
