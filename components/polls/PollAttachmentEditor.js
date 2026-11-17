'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { pollAPI } from '@/lib/api/polls';
import { formatAttachmentSize } from '@/lib/utils/attachmentSize';

export default function PollAttachmentEditor({ value = [], onChange, onBusyChange, disabled = false, savedIds = [] }) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const busy = disabled || uploading;

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setError('');
    if (!files.length) return;
    if (files.length + value.length > 10) {
      setError('Επιτρέπονται έως 10 συνημμένα ανά δημοσκόπηση.');
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    const next = [...value];
    const errors = [];
    try {
      for (const file of files) {
        try {
          const limit = file.type === 'application/pdf' ? 20 : 8;
          if (file.size > limit * 1024 * 1024) throw new Error(`Το αρχείο πρέπει να είναι έως ${limit} MB.`);
          const result = await pollAPI.uploadAttachment(file);
          next.push(result.attachment);
          onChange([...next]);
        } catch (uploadError) {
          errors.push(`${file.name}: ${uploadError.message}`);
        }
      }
      setError(errors.join('\n'));
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  const change = (index, patch) => onChange(value.map((item, i) => i === index ? { ...item, ...patch } : item));
  const move = (index, direction) => {
    const next = [...value];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  const remove = async (item) => {
    setError('');
    // Saved files remain available until the edit is successfully saved.
    if (!savedIds.includes(item.id)) {
      setUploading(true);
      onBusyChange?.(true);
      try {
        await pollAPI.removeStagedAttachment(item.id);
      } catch (removeError) {
        setError(removeError.message);
        return;
      } finally {
        setUploading(false);
        onBusyChange?.(false);
      }
    }
    onChange(value.filter(entry => entry.id !== item.id));
  };

  return (
    <section className="my-5 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-labelledby={`${inputId}-heading`}>
      <h3 id={`${inputId}-heading`} className="font-semibold text-gray-900">Φωτογραφίες & έγγραφα <span className="font-normal text-gray-500">(προαιρετικό)</span></h3>
      <p id={`${inputId}-help`} className="text-sm text-gray-600">Προσθέστε υλικό που βοηθά τους συμμετέχοντες να ενημερωθούν πριν ψηφίσουν. Έως 10 αρχεία: φωτογραφίες έως 8 MB και PDF έως 20 MB. Η πρόσβαση ακολουθεί την ορατότητα της δημοσκόπησης.</p>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-800">Προσθήκη φωτογραφιών ή PDF ({value.length}/10)</label>
      <input id={inputId} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf,.pdf" onChange={upload} disabled={busy || value.length >= 10} aria-describedby={`${inputId}-help`} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-medium file:text-blue-800 disabled:opacity-50" />
      <div role="status" aria-live="polite" className="text-sm text-gray-600">{uploading ? 'Επεξεργασία συνημμένων… Περιμένετε πριν αποθηκεύσετε.' : `${value.length} από 10 συνημμένα`}</div>
      {error && <p role="alert" className="whitespace-pre-wrap text-sm text-red-700">{error}</p>}
      <ol className="space-y-3">
        {value.map((item, index) => (
          <li key={item.id} className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-3 sm:flex-row">
            {item.mimeType.startsWith('image/') ? (
              <Image unoptimized src={item.thumbnailUrl || item.url} width={120} height={90} alt={item.caption || item.title} className="h-24 w-32 rounded object-contain bg-gray-100" />
            ) : <span className="flex h-24 w-32 shrink-0 items-center justify-center rounded bg-red-50 font-semibold text-red-800">PDF</span>}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="break-words text-xs text-gray-500">{item.originalName} · {formatAttachmentSize(item.size)}</p>
              <label className="block text-sm font-medium text-gray-800">Τίτλος αρχείου {index + 1}
                <input type="text" value={item.title} maxLength={255} disabled={busy} onChange={e => change(index, { title: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-normal" />
              </label>
              <label className="block text-sm font-medium text-gray-800">Λεζάντα {index + 1} (προαιρετικό)
                <input type="text" value={item.caption || ''} maxLength={500} disabled={busy} onChange={e => change(index, { caption: e.target.value })} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-normal" />
              </label>
              <div className="flex flex-wrap gap-2 text-sm">
                <button type="button" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Μετακίνηση συνημμένου ${index + 1} πάνω`} className="min-h-11 rounded border px-3 disabled:opacity-40">↑ Πάνω</button>
                <button type="button" onClick={() => move(index, 1)} disabled={busy || index === value.length - 1} aria-label={`Μετακίνηση συνημμένου ${index + 1} κάτω`} className="min-h-11 rounded border px-3 disabled:opacity-40">↓ Κάτω</button>
                <button type="button" onClick={() => remove(item)} disabled={busy} aria-label={`Αφαίρεση συνημμένου ${index + 1}`} className="min-h-11 rounded px-3 text-red-700 disabled:opacity-40">Αφαίρεση</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
