export default function AlertMessage({ tone = 'error', message, className = '' }) {
  if (!message) {
    return null;
  }

  const baseClasses = 'border px-4 py-3 rounded';
  const toneClasses = tone === 'success'
    ? 'bg-green-100 border-green-400 text-green-700'
    : 'bg-red-100 border-red-400 text-red-700';

  return (
    <div
      className={`${baseClasses} ${toneClasses} ${className}`}
      role={tone === 'success' ? 'status' : 'alert'}
    >
      {message}
    </div>
  );
}
