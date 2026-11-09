'use client';
export default function PartyBadge({ affiliation, className = '' }) {
  const party = affiliation?.organization;
  if (!party) return null;

  return (
    <span
      title={party.name}
      aria-label={`Κόμμα: ${party.name}`}
      className={`inline-flex items-center justify-center rounded-full ring-2 ring-white overflow-hidden ${className}`}
      style={{ backgroundColor: '#64748b' }}
    >
      {party.logo ? (
        <img src={party.logo} alt={party.name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="text-white text-[8px] font-bold leading-none">{party.name?.trim().charAt(0) || 'P'}</span>
      )}
    </span>
  );
}
