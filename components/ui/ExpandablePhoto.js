'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { MagnifyingGlassPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ExpandablePhoto({ src, name, className = '', children }) {
  const t = useTranslations('common.photoViewer');
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const [failedSource, setFailedSource] = useState(null);
  const label = t('view', { name });

  const openPhoto = () => {
    setFailedSource(null);
    setOpen(true);
    dialog.current.showModal();
  };

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        title={label}
        onClick={openPhoto}
        className={`group relative inline-flex shrink-0 cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 ${className}`}
      >
        {children}
        <span className="pointer-events-none absolute bottom-0 left-0 grid h-6 w-6 place-items-center rounded-full bg-slate-900/80 text-white ring-2 ring-white group-hover:bg-blue-700 group-focus-visible:bg-blue-700">
          <MagnifyingGlassPlusIcon className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label={label}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
        className="m-auto w-max min-w-[min(90vw,18rem)] max-w-[min(94vw,68rem)] max-h-[94dvh] overflow-auto rounded-2xl bg-slate-950 p-0 text-white shadow-2xl backdrop:bg-slate-950/80"
      >
        <div className="p-2 sm:p-3">
          <div className="flex items-center justify-between gap-4 pb-2 pl-2">
            <p className="min-w-0 break-words text-sm font-semibold">{name}</p>
            <button
              type="button"
              aria-label={t('close')}
              onClick={() => dialog.current.close()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {open && (failedSource === src ? (
            <p role="status" className="px-4 py-8 text-center text-sm text-slate-200">{t('unavailable')}</p>
          ) : (
            <Image
              src={src}
              alt={name}
              width={1600}
              height={900}
              unoptimized
              loading="eager"
              className="mx-auto block h-auto w-auto min-w-[min(80vw,16rem)] max-h-[75dvh] max-w-full rounded-lg object-contain"
              onError={() => setFailedSource(src)}
            />
          ))}
        </div>
      </dialog>
    </>
  );
}
