'use client';
import { getPartyById } from '@/lib/utils/politicalParties';

export default function PartyBadge({ partyId, className = '' }) {
  const party = getPartyById(partyId);
  if (!party) return null;

  return (
    <span
      title={party.name}
      aria-label={`Κόμμα: ${party.name}`}
      className={`inline-flex items-center justify-center rounded-full ring-2 ring-white overflow-hidden ${className}`}
      style={{ backgroundColor: party.color }}
    >
      {party.logo ? (
        <img src={party.logo} alt={party.name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="text-white text-[8px] font-bold leading-none">{party.abbreviation.charAt(0)}</span>
      )}
    </span>
  );
}
