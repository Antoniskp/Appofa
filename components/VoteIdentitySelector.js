'use client';

const OPTIONS = [
  { value: 'anonymous', label: 'Anonymous' },
  { value: 'public', label: 'Show my name' },
];

export default function VoteIdentitySelector({
  value = 'anonymous',
  onChange,
  disabled = false,
  compact = false,
}) {
  return (
    <fieldset className={compact ? 'space-y-1' : 'space-y-2'}>
      <legend className={compact ? 'text-xs font-medium text-gray-500' : 'text-sm font-medium text-gray-700'}>
        Vote as
      </legend>
      <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5">
        {OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              aria-pressed={active}
              className={`${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
