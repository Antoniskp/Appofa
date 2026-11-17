'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatAttachmentSize } from '@/lib/utils/attachmentSize';

export default function PollAttachments({ attachments = [] }) {
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  useEffect(() => {
    if (selected && !dialog.current.open) dialog.current.showModal();
  }, [selected]);
  if (!attachments.length) return null;
  return (
    <section className="my-6 space-y-3" aria-label="Φωτογραφίες και έγγραφα δημοσκόπησης">
      <h2 className="text-lg font-semibold text-gray-900">Φωτογραφίες & έγγραφα</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map(item => (
          <li key={item.id} className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {item.mimeType.startsWith('image/') ? (
              <button type="button" onClick={() => setSelected(item)} className="block w-full bg-gray-50 focus-visible:outline-blue-600" aria-label={`Μεγέθυνση: ${item.title}`}>
                <Image unoptimized src={item.thumbnailUrl || item.url} alt={item.caption || item.title} width={480} height={270} className="h-40 w-full object-contain" />
              </button>
            ) : <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex h-24 items-center justify-center bg-red-50 text-xl font-semibold text-red-800" aria-label={`Άνοιγμα PDF: ${item.title}`}>PDF ↗</a>}
            <div className="space-y-2 p-3">
              <p className="break-words font-medium text-gray-900">{item.title}</p>
              {item.caption && <p className="break-words whitespace-pre-wrap text-sm text-gray-600">{item.caption}</p>}
              <p className="text-xs text-gray-500">{item.mimeType === 'application/pdf' ? 'PDF' : 'Φωτογραφία'} · {formatAttachmentSize(item.size)}</p>
              <a href={`${item.url}?download=true`} className="inline-flex min-h-11 items-center text-sm font-medium text-blue-700 hover:underline">Λήψη αρχείου</a>
            </div>
          </li>
        ))}
      </ul>
      <dialog ref={dialog} onClose={() => setSelected(null)} aria-label={selected?.title || 'Προβολή φωτογραφίας'} className="max-h-[90vh] w-[min(95vw,1100px)] rounded-xl p-4 backdrop:bg-black/70">
        {selected && <>
          <div className="mb-3 flex items-center justify-between gap-4"><p className="break-words font-semibold">{selected.title}</p><button type="button" onClick={() => dialog.current.close()} className="min-h-11 shrink-0 rounded border px-3">Κλείσιμο</button></div>
          <Image unoptimized src={selected.url} alt={selected.caption || selected.title} width={1600} height={900} className="max-h-[70vh] w-full object-contain" />
          {selected.caption && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{selected.caption}</p>}
        </>}
      </dialog>
    </section>
  );
}
