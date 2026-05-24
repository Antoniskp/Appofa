import Link from 'next/link';
import { getChildLocationTerminology } from '@/lib/constants/locations';

function LocationChip({ location, tone = 'gray' }) {
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    gray: 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
  };

  return (
    <Link
      href={`/locations/${location.slug || location.id}`}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${toneClasses[tone] || toneClasses.gray}`}
    >
      {location.name_local || location.name}
    </Link>
  );
}

export default function LocationRelatedLocations({
  location,
  parent,
  siblings = [],
  children = [],
  hideChildren = false,
}) {
  if (!parent && siblings.length === 0 && (hideChildren || children.length === 0)) {
    return null;
  }

  const visibleSiblings = siblings.slice(0, 8);
  const visibleChildren = hideChildren ? [] : children.slice(0, 8);
  const childLocationTerms = getChildLocationTerminology(location?.type);

  return (
    <section
      id="location-related"
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900">Κοντινές και σχετικές τοποθεσίες</h2>
        <p className="text-sm text-gray-600">
          Ανακάλυψε σχετικές επιλογές χωρίς εκτεταμένη πλοήγηση στην ιεραρχία.
        </p>
      </div>

      <div className="space-y-3">
        {parent && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ανήκει σε</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <LocationChip location={parent} tone="blue" />
            </div>
          </div>
        )}

        {visibleSiblings.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Σχετικές τοποθεσίες</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleSiblings.map((sibling) => (
                <LocationChip key={sibling.id} location={sibling} />
              ))}
            </div>
            {siblings.length > visibleSiblings.length && (
              <p className="mt-2 text-xs text-gray-500">
                +{siblings.length - visibleSiblings.length} ακόμη σχετικές τοποθεσίες
              </p>
            )}
          </div>
        )}

        {visibleChildren.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{childLocationTerms.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleChildren.map((child) => (
                <LocationChip key={child.id} location={child} tone="emerald" />
              ))}
            </div>
            {children.length > visibleChildren.length && (
              <p className="mt-2 text-xs text-gray-500">
                +{children.length - visibleChildren.length} ακόμη {childLocationTerms.lowerPlural}
              </p>
            )}
          </div>
        )}

        {!parent && visibleSiblings.length === 0 && (hideChildren || visibleChildren.length === 0) && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500">
            Δεν υπάρχουν ακόμη σχετικές τοποθεσίες για το {location.name_local || location.name}.
          </div>
        )}
      </div>
    </section>
  );
}
