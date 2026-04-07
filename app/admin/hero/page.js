'use client';

import { useState, useMemo } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AlertMessage from '@/components/ui/AlertMessage';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { heroSettingsAPI } from '@/lib/api';
import { useAsyncData } from '@/hooks/useAsyncData';
import AdminLayout from '@/components/admin/AdminLayout';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';

const EMPTY_SLIDE_FORM = { title: '', subtitle: '', linkUrl: '', linkText: '' };

function HeroSettingsContent() {
  // --- Background settings state ---
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1a2a3a');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { loading, error: settingsLoadError } = useAsyncData(
    () => heroSettingsAPI.get(),
    [],
    {
      onSuccess: (res) => {
        setBackgroundImageUrl(res?.data?.backgroundImageUrl || '');
        setBackgroundColor(res?.data?.backgroundColor || '#1a2a3a');
      },
    }
  );

  // --- Slides state ---
  const [slidesSaving, setSlidesSaving] = useState(false);
  const [slidesSuccessMsg, setSlidesSuccessMsg] = useState('');
  const [slidesErrorMsg, setSlidesErrorMsg] = useState('');
  const [newSlideForm, setNewSlideForm] = useState(EMPTY_SLIDE_FORM);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_SLIDE_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const { data: slides, setData: setSlides, loading: slidesLoading, error: slidesLoadError } = useAsyncData(
    () => heroSettingsAPI.getSlides(),
    [],
    {
      initialData: [],
      transform: (res) => res?.data || [],
    }
  );

  const clearMessages = () => { setSuccessMsg(''); setErrorMsg(''); };
  const clearSlidesMessages = () => { setSlidesSuccessMsg(''); setSlidesErrorMsg(''); };

  // Sanitize image URL to ensure it's a valid http/https URL before using in DOM
  const safePreviewUrl = useMemo(() => {
    if (!backgroundImageUrl) return null;
    try {
      const url = new URL(backgroundImageUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return url.href;
    } catch {
      return null;
    }
  }, [backgroundImageUrl]);

  const handleSave = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await heroSettingsAPI.update({ backgroundImageUrl, backgroundColor });
      if (res?.success) {
        setSuccessMsg(res.message || 'Οι ρυθμίσεις αποθηκεύτηκαν.');
      } else {
        setErrorMsg(res?.message || 'Αποτυχία αποθήκευσης.');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Αποτυχία αποθήκευσης.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearImage = async () => {
    clearMessages();
    setSaving(true);
    try {
      const res = await heroSettingsAPI.update({ backgroundImageUrl: '', backgroundColor });
      if (res?.success) {
        setBackgroundImageUrl('');
        setSuccessMsg('Η εικόνα φόντου αφαιρέθηκε.');
      } else {
        setErrorMsg(res?.message || 'Αποτυχία αφαίρεσης εικόνας.');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Αποτυχία αφαίρεσης εικόνας.');
    } finally {
      setSaving(false);
    }
  };

  // --- Slide handlers ---
  // All mutations replace the entire slides state from the server response,
  // preventing frontend/backend state drift.
  const handleToggleSlide = async (id) => {
    clearSlidesMessages();
    setSlidesSaving(true);
    try {
      const res = await heroSettingsAPI.toggleSlide(id);
      if (res?.success) {
        setSlidesSuccessMsg(res.message || 'Η κατάσταση του slide άλλαξε.');
        if (Array.isArray(res.data)) setSlides(res.data);
      } else {
        setSlidesErrorMsg(res?.message || 'Αποτυχία αλλαγής κατάστασης.');
      }
    } catch (err) {
      setSlidesErrorMsg(err?.message || 'Αποτυχία αλλαγής κατάστασης.');
    } finally {
      setSlidesSaving(false);
    }
  };

  const handleDeleteSlide = async (id) => {
    clearSlidesMessages();
    setSlidesSaving(true);
    try {
      const res = await heroSettingsAPI.deleteSlide(id);
      if (res?.success) {
        setSlidesSuccessMsg('Το slide διαγράφηκε.');
        setConfirmDeleteId(null);
        if (Array.isArray(res.data)) setSlides(res.data);
      } else {
        setSlidesErrorMsg(res?.message || 'Αποτυχία διαγραφής.');
      }
    } catch (err) {
      setSlidesErrorMsg(err?.message || 'Αποτυχία διαγραφής.');
    } finally {
      setSlidesSaving(false);
    }
  };

  const handleMoveSlide = async (id, direction) => {
    if (slidesSaving) return;
    clearSlidesMessages();

    // Snapshot current state for rollback on error
    const snapshot = slides;
    const currentIdx = snapshot.findIndex((s) => s.id === id);
    if (currentIdx === -1) return;

    const swapIdx = direction === 'up' ? currentIdx - 1 : currentIdx + 1;
    if (swapIdx < 0 || swapIdx >= snapshot.length) return;

    // Build reordered array and apply optimistic update immediately
    const reordered = [...snapshot];
    [reordered[currentIdx], reordered[swapIdx]] = [reordered[swapIdx], reordered[currentIdx]];
    setSlides(reordered);

    setSlidesSaving(true);
    try {
      const res = await heroSettingsAPI.reorderSlides(reordered.map((s) => s.id));
      if (res?.success) {
        setSlidesSuccessMsg('Τα slides αναδιατάχθηκαν.');
        if (Array.isArray(res.data)) setSlides(res.data);
      } else {
        setSlides(snapshot);
        setSlidesErrorMsg(res?.message || 'Αποτυχία αναδιάταξης.');
      }
    } catch (err) {
      setSlides(snapshot);
      setSlidesErrorMsg(err?.message || 'Αποτυχία αναδιάταξης.');
    } finally {
      setSlidesSaving(false);
    }
  };

  const handleStartEdit = (slide) => {
    setEditingSlideId(slide.id);
    setEditForm({
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      linkUrl: slide.linkUrl || '',
      linkText: slide.linkText || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingSlideId(null);
    setEditForm(EMPTY_SLIDE_FORM);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      setSlidesErrorMsg('Ο τίτλος είναι υποχρεωτικός.');
      return;
    }
    if (!editForm.subtitle.trim()) {
      setSlidesErrorMsg('Ο υπότιτλος είναι υποχρεωτικός.');
      return;
    }
    clearSlidesMessages();
    setSlidesSaving(true);
    try {
      const res = await heroSettingsAPI.updateSlide(editingSlideId, editForm);
      if (res?.success) {
        setSlidesSuccessMsg('Το slide ενημερώθηκε.');
        if (Array.isArray(res.data)) setSlides(res.data);
        setEditingSlideId(null);
        setEditForm(EMPTY_SLIDE_FORM);
      } else {
        setSlidesErrorMsg(res?.message || 'Αποτυχία ενημέρωσης.');
      }
    } catch (err) {
      setSlidesErrorMsg(err?.message || 'Αποτυχία ενημέρωσης.');
    } finally {
      setSlidesSaving(false);
    }
  };

  const handleCreateSlide = async () => {
    if (!newSlideForm.title.trim()) {
      setSlidesErrorMsg('Ο τίτλος είναι υποχρεωτικός.');
      return;
    }
    if (!newSlideForm.subtitle.trim()) {
      setSlidesErrorMsg('Ο υπότιτλος είναι υποχρεωτικός.');
      return;
    }
    clearSlidesMessages();
    setSlidesSaving(true);
    try {
      const res = await heroSettingsAPI.createSlide(newSlideForm);
      if (res?.success) {
        setSlidesSuccessMsg('Νέο slide δημιουργήθηκε.');
        setNewSlideForm(EMPTY_SLIDE_FORM);
        if (Array.isArray(res.data)) setSlides(res.data);
      } else {
        setSlidesErrorMsg(res?.message || 'Αποτυχία δημιουργίας.');
      }
    } catch (err) {
      setSlidesErrorMsg(err?.message || 'Αποτυχία δημιουργίας.');
    } finally {
      setSlidesSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="app-container max-w-4xl">
            <SkeletonLoader type="form" count={2} />
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Array position IS the canonical order — no sorting needed
  const sortedSlides = slides;

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="app-container max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ρυθμίσεις Hero</h1>
          <p className="text-sm text-gray-500 mt-1">
            Διαχειριστείτε το φόντο και τα slides της κεντρικής ενότητας hero στην αρχική σελίδα.
          </p>
        </div>

        {/* Background Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800">Ρυθμίσεις Φόντου</h2>
          {successMsg && <AlertMessage tone="success" message={successMsg} />}
          {(errorMsg || settingsLoadError) && <AlertMessage tone="error" message={errorMsg || settingsLoadError} />}

          {/* Background Image URL */}
          <div>
            <label htmlFor="bgImageUrl" className="block text-sm font-semibold text-gray-700 mb-1">
              URL Εικόνας Φόντου
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Αφήστε κενό για να εμφανιστεί μόνο το χρώμα φόντου.
            </p>
            <input
              id="bgImageUrl"
              type="url"
              value={backgroundImageUrl}
              onChange={(e) => setBackgroundImageUrl(e.target.value)}
              placeholder="https://example.com/hero-image.jpg"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {safePreviewUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-40">
                <img
                  src={safePreviewUrl}
                  alt="Hero background preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Fallback Background Color */}
          <div>
            <label htmlFor="bgColor" className="block text-sm font-semibold text-gray-700 mb-1">
              Χρώμα Φόντου (Fallback)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Εμφανίζεται όταν δεν υπάρχει εικόνα ή η εικόνα δεν φορτώνει.
            </p>
            <div className="flex items-center gap-3">
              <input
                id="bgColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <span className="text-sm text-gray-600 font-mono">{backgroundColor}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 transition"
            >
              {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
            </button>
            {backgroundImageUrl && (
              <button
                onClick={handleClearImage}
                disabled={saving}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 transition"
              >
                Αφαίρεση Εικόνας
              </button>
            )}
          </div>
        </div>

        {/* Hero Slides Manager */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Slides Τίτλων</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Διαχειριστείτε τους τίτλους και τα υπότιτλα που εναλλάσσονται στο hero section.
              </p>
            </div>
          </div>

          {slidesSuccessMsg && <AlertMessage tone="success" message={slidesSuccessMsg} />}
          {(slidesErrorMsg || slidesLoadError) && <AlertMessage tone="error" message={slidesErrorMsg || slidesLoadError} />}

          {/* Slides list */}
          {slidesLoading && sortedSlides.length === 0 ? (
            <SkeletonLoader type="form" count={2} />
          ) : sortedSlides.length === 0 ? (
            <p className="text-gray-400 text-sm italic">Δεν υπάρχουν slides. Δημιουργήστε ένα παρακάτω.</p>
          ) : (
            <div className="space-y-3">
              {sortedSlides.map((slide, idx) => (
                <div key={slide.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Slide row */}
                  <div className="flex items-start gap-3 p-4">
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                      <button
                        onClick={() => handleMoveSlide(slide.id, 'up')}
                        disabled={slidesSaving || idx === 0}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition"
                        aria-label="Μετακίνηση πάνω"
                      >
                        <ChevronUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSlide(slide.id, 'down')}
                        disabled={slidesSaving || idx === sortedSlides.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition"
                        aria-label="Μετακίνηση κάτω"
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            slide.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {slide.isActive ? 'Ενεργό' : 'Ανενεργό'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">{slide.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{slide.subtitle}</p>
                      {slide.linkUrl && (
                        <p className="text-xs text-indigo-500 mt-1 truncate">
                          🔗 {slide.linkText || 'Link'}: {slide.linkUrl}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleSlide(slide.id)}
                        disabled={slidesSaving}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition disabled:opacity-50 ${
                          slide.isActive
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {slide.isActive ? 'Απενεργ.' : 'Ενεργ.'}
                      </button>
                      <button
                        onClick={() => handleStartEdit(slide)}
                        disabled={slidesSaving}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition"
                        aria-label="Επεξεργασία"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      {confirmDeleteId === slide.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteSlide(slide.id)}
                            disabled={slidesSaving}
                            className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            Επιβεβαίωση
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
                          >
                            Άκυρο
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(slide.id)}
                          disabled={slidesSaving}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
                          aria-label="Διαγραφή"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {editingSlideId === slide.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Επεξεργασία Slide</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Τίτλος *</label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Υπότιτλος *</label>
                          <textarea
                            value={editForm.subtitle}
                            onChange={(e) => setEditForm((f) => ({ ...f, subtitle: e.target.value }))}
                            rows={3}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL Link (προαιρετικό)</label>
                          <input
                            type="url"
                            value={editForm.linkUrl}
                            onChange={(e) => setEditForm((f) => ({ ...f, linkUrl: e.target.value }))}
                            placeholder="https://example.com"
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Κείμενο Link (προαιρετικό)</label>
                          <input
                            type="text"
                            value={editForm.linkText}
                            onChange={(e) => setEditForm((f) => ({ ...f, linkText: e.target.value }))}
                            placeholder="Μάθε περισσότερα"
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={slidesSaving}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          {slidesSaving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
                        >
                          Άκυρο
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create new slide form */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <PlusIcon className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-800">Νέο Slide</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Τίτλος *</label>
                <input
                  type="text"
                  value={newSlideForm.title}
                  onChange={(e) => setNewSlideForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="π.χ. Αποφάσεις που ξεκινούν από εσένα."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Υπότιτλος *</label>
                <textarea
                  value={newSlideForm.subtitle}
                  onChange={(e) => setNewSlideForm((f) => ({ ...f, subtitle: e.target.value }))}
                  rows={3}
                  placeholder="π.χ. Συμμετείχε σε ανοιχτές ψηφοφορίες..."
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">URL Link (προαιρετικό)</label>
                <input
                  type="url"
                  value={newSlideForm.linkUrl}
                  onChange={(e) => setNewSlideForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Κείμενο Link (προαιρετικό)</label>
                <input
                  type="text"
                  value={newSlideForm.linkText}
                  onChange={(e) => setNewSlideForm((f) => ({ ...f, linkText: e.target.value }))}
                  placeholder="Μάθε περισσότερα"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleCreateSlide}
                disabled={slidesSaving}
                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 transition"
              >
                {slidesSaving ? 'Δημιουργία...' : 'Δημιουργία Slide'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}

export default function AdminHeroPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <HeroSettingsContent />
    </ProtectedRoute>
  );
}
