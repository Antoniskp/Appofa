'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPinIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { videoPinAPI } from '@/lib/api';
import { buildVideoPinMarkers } from '@/lib/utils/videoPinMarkers';

const BaseMap = dynamic(() => import('@/components/map/BaseMap'), { ssr: false });
const CENTER = [38.4, 23.7];
const EXPIRY_OPTIONS = [1, 2, 4, 8];
const CATEGORY_OPTIONS = ['local-news', 'traffic', 'weather', 'events', 'safety', 'community', 'other'];

function isInGreece(lat, lng) {
  return lat >= 34.5 && lat <= 41.9 && lng >= 19 && lng <= 30;
}

export default function LiveStreamsMap() {
  const t = useTranslations('liveMap');
  const { user } = useAuth();
  const [pins, setPins] = useState([]);
  const [trust, setTrust] = useState({ approvedLivePinCount: 0, maxDurationHours: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('local-news');
  const [duration, setDuration] = useState(1);
  const [point, setPoint] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const loadPins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await videoPinAPI.getAll({ contentType: 'live', sort: 'newest' });
      if (!response?.success) throw new Error(response?.message || t('loadError'));
      setPins(response.data?.videoPins || []);
      if (response.data?.trust) {
        setTrust(response.data.trust);
        setDuration((current) => Math.min(current, response.data.trust.maxDurationHours));
      }
    } catch (err) {
      setError(err?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadPins(); }, [loadPins]);

  const visiblePins = useMemo(
    () => pins.filter((pin) => isInGreece(Number(pin.lat), Number(pin.lng)) && (category === 'all' || pin.category === category)),
    [category, pins]
  );
  const markers = useMemo(() => [
    ...buildVideoPinMarkers(visiblePins),
    ...(point ? [{ lat: point.lat, lng: point.lng, label: t('selectedPoint'), variant: 'selected', iconColor: '#e11d48' }] : []),
  ], [point, t, visiblePins]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    if (!point || !sourceUrl.trim()) return;
    setSubmitting(true);
    try {
      const response = await videoPinAPI.create({
        sourceUrl: sourceUrl.trim(),
        contentType: 'live',
        category: selectedCategory,
        title: title.trim() || undefined,
        lat: point.lat,
        lng: point.lng,
        expiresInHours: duration,
      });
      if (!response?.success) throw new Error(response?.message || t('submitError'));
      setNotice(response.data?.videoPin?.status === 'approved' ? t('submitted') : t('pendingReview'));
      setSourceUrl('');
      setTitle('');
      setPoint(null);
      setFormOpen(false);
      await loadPins();
    } catch (err) {
      setNotice(err?.message || t('submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMapClick = (lat, lng) => {
    if (isInGreece(lat, lng)) setPoint({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <div className="app-container py-6 sm:py-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-rose-600">{t('eyebrow')}</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">{t('subtitle')}</p>
          </div>
          {user ? (
            <button type="button" onClick={() => { setFormOpen((open) => !open); setNotice(''); }}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-rose-700">
              <PlusCircleIcon className="h-5 w-5" />{t('addStream')}
            </button>
          ) : (
            <Link href="/login" className="rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700">{t('signInToAdd')}</Link>
          )}
        </header>

        {notice && <p role="status" className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}

        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label={t('filterCategory')}>
          {['all', ...CATEGORY_OPTIONS].map((value) => (
            <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${category === value ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300'}`}>
              {value === 'all' ? t('allCategories') : t(`category_${value}`)}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-500">{t('activeCount', { count: visiblePins.length })}</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <BaseMap center={CENTER} zoom={6} markers={markers} clusterMarkers scrollWheelZoom
              className="h-[58vh] min-h-[420px] w-full" onMapClick={formOpen ? handleMapClick : undefined} />
            <div className="flex items-start gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p>{formOpen ? t('mapPick') : t('mapHint')}</p>
            </div>
          </section>

          <aside className="space-y-4">
            {formOpen && user && (
              <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">{t('formTitle')}</h2>
                <p className="text-sm text-slate-600">{t('formHint')}</p>
                <label className="block text-sm font-medium text-slate-700" htmlFor="live-source">{t('streamLink')}</label>
                <input id="live-source" type="url" required value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.youtube.com/live/…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <label className="block text-sm font-medium text-slate-700" htmlFor="live-title">{t('shortTitle')}</label>
                <input id="live-title" type="text" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <label className="block text-sm font-medium text-slate-700" htmlFor="live-category">{t('category')}</label>
                <select id="live-category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {CATEGORY_OPTIONS.map((value) => <option key={value} value={value}>{t(`category_${value}`)}</option>)}
                </select>
                <label className="block text-sm font-medium text-slate-700" htmlFor="live-duration">{t('duration')}</label>
                <select id="live-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {EXPIRY_OPTIONS.filter((hours) => hours <= trust.maxDurationHours).map((hours) => <option key={hours} value={hours}>{t('durationHours', { hours })}</option>)}
                </select>
                <p className="text-xs text-slate-500">{t('trustStatus', { count: trust.approvedLivePinCount, max: trust.maxDurationHours })}</p>
                <p className="text-xs text-slate-500">{point ? t('pointSelected', { lat: point.lat, lng: point.lng }) : t('pointRequired')}</p>
                <button type="submit" disabled={!point || submitting} className="w-full rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? t('submitting') : t('publish')}
                </button>
              </form>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-slate-900">{t('listTitle')}</h2>
              {loading ? <p className="py-6 text-center text-sm text-slate-500">{t('loading')}</p>
                : error ? <div className="space-y-3 py-4 text-center"><p className="text-sm text-red-700">{error}</p><button type="button" onClick={loadPins} className="text-sm font-semibold text-blue-700">{t('retry')}</button></div>
                  : visiblePins.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">{t('empty')}</p>
                    : <ul className="max-h-[54vh] space-y-3 overflow-y-auto">
                      {visiblePins.map((pin) => (
                        <li key={pin.id} className="rounded-xl border border-slate-100 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">{pin.sourceProvider}</span>
                            {pin.expiresAt && <span className="text-xs text-slate-500">{t('expires', { time: new Date(pin.expiresAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) })}</span>}
                          </div>
                          <p className="mt-2 font-semibold text-slate-900">{pin.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{pin.location?.name_local || pin.location?.name || t('communityPin')}</p>
                          <a href={pin.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-semibold text-blue-700 hover:underline">{t('openStream')} ↗</a>
                        </li>
                      ))}
                    </ul>}
            </section>
          </aside>
        </div>
        <p className="mt-4 text-xs text-slate-500">{t('safetyNote')}</p>
      </div>
    </main>
  );
}
