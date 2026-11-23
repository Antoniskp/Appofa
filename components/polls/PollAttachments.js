'use client';

import Image from 'next/image';
import { formatAttachmentSize } from '@/lib/utils/attachmentSize';
import ExpandablePhoto from '@/components/ui/ExpandablePhoto';

export default function PollAttachments({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <section className="my-6 space-y-3" aria-label="Φωτογραφίες και έγγραφα δημοσκόπησης">
      <h2 className="text-lg font-semibold text-gray-900">Φωτογραφίες & έγγραφα</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map(item => (
          <li key={item.id} className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {item.mimeType.startsWith('image/') ? (
              <ExpandablePhoto src={item.url} name={item.title} caption={item.caption} className="w-full bg-gray-50 focus-visible:-outline-offset-2">
                <Image unoptimized src={item.thumbnailUrl || item.url} alt={item.caption || item.title} width={480} height={270} className="h-40 w-full object-contain" />
              </ExpandablePhoto>
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
    </section>
  );
}
