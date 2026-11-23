import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function CalendarPill({ pressed, onClick, children }) {
  const Icon = pressed ? CheckIcon : PlusIcon;
  return <button type="button" aria-pressed={pressed} onClick={onClick}
    className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-brand-border px-3 text-left text-sm font-semibold text-charcoal hover:bg-ivory focus-visible:outline-copper aria-pressed:border-blue-700 aria-pressed:bg-blue-700 aria-pressed:text-white aria-pressed:hover:bg-blue-800">
    <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
    <span className="break-words">{children}</span>
  </button>;
}
