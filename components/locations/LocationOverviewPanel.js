import Link from 'next/link';
import { getChildLocationTerminology } from '@/lib/constants/locations';

function OverviewCard({ label, value, href, valueClassName, description, emptyHint }) {
  const hasValue = value > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            {hasValue ? description : emptyHint}
          </p>
        </div>
        <span className={`inline-flex min-w-12 justify-center rounded-full border px-3 py-1 text-sm font-semibold ${valueClassName}`}>
          {value}
        </span>
      </div>
      {href && (
        <Link
          href={href}
          className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
        >
          {hasValue ? 'Προβολή' : 'Επόμενο βήμα'} →
        </Link>
      )}
    </div>
  );
}

export default function LocationOverviewPanel({
  locationIdentifier,
  locationType,
  summaryCounts,
  canManageLocations = false,
}) {
  const childLocationTerms = getChildLocationTerminology(locationType);

  const cards = [
    {
      key: 'suggestions',
      label: 'Προτάσεις',
      value: summaryCounts.suggestions,
      href: `/locations/${locationIdentifier}?tab=suggestions#location-content`,
      valueClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      description: 'Υπάρχουν ήδη προτάσεις και αιτήματα συνδεδεμένα με αυτή την περιοχή.',
      emptyHint: 'Δεν υπάρχει ακόμα κάποια πρόταση. Ξεκίνα από την καρτέλα περιεχομένου όταν θελήσεις να ανοίξεις συζήτηση.',
    },
    {
      key: 'representatives',
      label: 'Εκπρόσωποι',
      value: summaryCounts.representatives,
      href: '#location-roles',
      valueClassName: 'border-sky-200 bg-sky-50 text-sky-700',
      description: 'Υπάρχουν καταγεγραμμένοι εκπρόσωποι ή ρόλοι για τη συγκεκριμένη τοποθεσία.',
      emptyHint: canManageLocations
        ? 'Δεν έχουν οριστεί ακόμη ρόλοι. Χρησιμοποίησε το Edit στην κορυφή για να προσθέσεις υπεύθυνους και εκπροσώπους.'
        : 'Δεν έχουν οριστεί ακόμη εκπρόσωποι για αυτή την περιοχή.',
    },
    {
      key: 'announcements',
      label: 'Ανακοινώσεις',
      value: summaryCounts.announcements,
      href: '#location-local-info',
      valueClassName: 'border-amber-200 bg-amber-50 text-amber-800',
      description: 'Υπάρχουν ενεργές ανακοινώσεις ή ειδοποιήσεις που αξίζει να δεις πρώτα.',
      emptyHint: canManageLocations
        ? 'Δεν υπάρχει ενεργή ανακοίνωση. Μπορείς να προσθέσεις μία από την επεξεργασία της τοποθεσίας.'
        : 'Δεν υπάρχει ενεργή ανακοίνωση για αυτή την τοποθεσία αυτή τη στιγμή.',
    },
    {
      key: 'media',
      label: 'Τοπικά μέσα',
      value: summaryCounts.media,
      href: '#location-local-info',
      valueClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      description: 'Έχουν ήδη δηλωθεί τοπικές πηγές ενημέρωσης για να παρακολουθείς την περιοχή.',
      emptyHint: canManageLocations
        ? 'Δεν έχουν προστεθεί ακόμη τοπικά μέσα. Συμπλήρωσέ τα από την επεξεργασία όταν είναι διαθέσιμα.'
        : 'Δεν έχουν προστεθεί ακόμη τοπικές πηγές ενημέρωσης.',
    },
    {
      key: 'community',
      label: 'Κοινότητα',
      value: summaryCounts.community,
      href: `/locations/${locationIdentifier}?tab=users#location-content`,
      valueClassName: 'border-violet-200 bg-violet-50 text-violet-700',
      description: 'Η τοποθεσία έχει ήδη συνδεδεμένα μέλη και δημόσια προφίλ στην κοινότητα.',
      emptyHint: 'Δεν έχουν συνδεθεί ακόμη δημόσια προφίλ με αυτή την περιοχή.',
    },
    {
      key: 'children',
      label: childLocationTerms.label,
      value: summaryCounts.children,
      href: '#location-related',
      valueClassName: 'border-gray-200 bg-gray-50 text-gray-700',
      description: `Υπάρχουν διαθέσιμες τοποθεσίες (${childLocationTerms.lowerPlural}) για γρήγορη πλοήγηση στη διοικητική ιεραρχία.`,
      emptyHint: `Δεν υπάρχουν καταγεγραμμένες τοποθεσίες (${childLocationTerms.lowerPlural}) κάτω από αυτή την τοποθεσία.`,
    },
  ];

  return (
    <section
      id="location-overview"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Σύνοψη τοποθεσίας</h2>
          <p className="text-sm text-gray-600">
            Τα πιο χρήσιμα στοιχεία για να δεις γρήγορα τι υπάρχει ήδη σε αυτή την περιοχή.
          </p>
        </div>
        <Link
          href={`#location-content`}
          className="inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline"
        >
          Μετάβαση στο περιεχόμενο →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ key, ...card }) => (
          <OverviewCard key={key} {...card} />
        ))}
      </div>
    </section>
  );
}
