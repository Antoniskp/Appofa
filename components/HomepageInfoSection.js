'use client';

import { useEffect, useMemo, useState } from 'react';

function LinkCard({ item }) {
  const isExternal = /^https?:\/\//i.test(item.href);
  return (
    <a
      href={item.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer noopener' : undefined}
      className="rounded-lg border border-amber-200 bg-white px-4 py-3 hover:border-amber-300 hover:shadow-sm transition"
    >
      <div className="text-2xl mb-1">{item.icon || '🔗'}</div>
      <div className="text-sm font-medium text-gray-800">{item.text}</div>
    </a>
  );
}

export default function HomepageInfoSection({ settings }) {
  const [dismissed, setDismissed] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(true);
  const [doneOpen, setDoneOpen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(window.localStorage.getItem('infoBannerDismissed') === '1');
  }, []);

  const roadmap = useMemo(() => (Array.isArray(settings?.roadmap) ? settings.roadmap.filter(Boolean) : []), [settings]);
  const done = useMemo(() => (Array.isArray(settings?.done) ? settings.done.filter(Boolean) : []), [settings]);
  const quickLinks = useMemo(() => (Array.isArray(settings?.quickLinks) ? settings.quickLinks.filter((item) => item?.text && item?.href) : []), [settings]);

  const total = roadmap.length + done.length;
  const progress = total > 0 ? Math.round((done.length / total) * 100) : 0;

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('infoBannerDismissed', '1');
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <section className="bg-amber-50 border-y border-amber-200">
      <div className="app-container py-6 space-y-4">
        <div className="flex justify-between gap-4 items-start">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-amber-900">{settings?.bannerText || 'Ψήφισε ελεύθερα · Ανώνυμα'}</h2>
            <p className="text-sm text-amber-800 mt-1">{settings?.subText || 'Πριν γράψεις, καλό θα είναι να γνωρίζεις αυτά'}</p>
            {settings?.experimentalNotice && (
              <span className="inline-flex mt-2 items-center rounded-full bg-amber-200 text-amber-900 px-2 py-1 text-xs font-semibold">
                ⚠️ Πειραματικό
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs px-3 py-1.5 rounded-md border border-amber-300 text-amber-900 hover:bg-amber-100 transition"
          >
            Απόκρυψη
          </button>
        </div>

        {quickLinks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickLinks.map((item, index) => (
              <LinkCard key={index} item={item} />
            ))}
          </div>
        )}

        {total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-amber-900">
              <span>Πρόοδος</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {roadmap.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-white">
            <button
              type="button"
              onClick={() => setRoadmapOpen((v) => !v)}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-800"
            >
              Θέλουμε να κάνουμε τα παρακάτω {roadmapOpen ? '▾' : '▸'}
            </button>
            {roadmapOpen && (
              <ul className="px-6 pb-4 list-disc space-y-1 text-sm text-gray-700">
                {roadmap.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            )}
          </div>
        )}

        {done.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-white">
            <button
              type="button"
              onClick={() => setDoneOpen((v) => !v)}
              className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-800"
            >
              Έχουμε κάνει τα παρακάτω {doneOpen ? '▾' : '▸'}
            </button>
            {doneOpen && (
              <ul className="px-6 pb-4 list-disc space-y-1 text-sm text-gray-700">
                {done.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
