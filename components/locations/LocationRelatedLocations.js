import Link from 'next/link';

const TYPE_LABELS = {
  international: 'Διεθνής περιοχή',
  country: 'Χώρα',
  prefecture: 'Νομός / Περιφέρεια',
  municipality: 'Δήμος',
  electoral_district: 'Εκλογική περιφέρεια',
};

function RelatedLocationLink({ location, tone = 'gray' }) {
  const toneClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
  };

  return (
    <Link
      href={`/locations/${location.slug || location.id}`}
      className={`block rounded-xl border p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/70 ${toneClasses[tone] || toneClasses.gray}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {TYPE_LABELS[location.type] || location.type}
      </p>
      <p className="mt-1 text-sm font-semibold">
        {location.name_local || location.name}
      </p>
      {location.parent?.name && (
        <p className="mt-1 text-xs text-gray-500">
          Ανήκει σε {location.parent.name_local || location.parent.name}
        </p>
      )}
    </Link>
  );
}

export default function LocationRelatedLocations({
  location,
  parent,
  siblings = [],
  children = [],
}) {
  if (!parent && siblings.length === 0 && children.length === 0) {
    return null;
  }

  const visibleSiblings = siblings.slice(0, 6);
  const visibleChildren = children.slice(0, 6);

  return (
    <section
      id="location-related"
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Πλοήγηση στην ιεραρχία</h2>
        <p className="text-sm text-gray-600">
          Ανακάλυψε γρήγορα τη γονική περιοχή, τις συγγενικές τοποθεσίες και τις υποπεριοχές.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Γονική περιοχή</h3>
          <p className="mt-1 text-sm text-gray-600">
            Ανέβα ένα επίπεδο για ευρύτερο διοικητικό ή γεωγραφικό πλαίσιο.
          </p>
          <div className="mt-3">
            {parent ? (
              <RelatedLocationLink location={parent} tone="blue" />
            ) : (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-4 text-sm text-gray-500">
                Αυτή η τοποθεσία βρίσκεται ήδη στο ανώτερο διαθέσιμο επίπεδο.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Σχετικές γειτονικές τοποθεσίες</h3>
          <p className="mt-1 text-sm text-gray-600">
            Άλλες τοποθεσίες στο ίδιο επίπεδο της ιεραρχίας.
          </p>
          <div className="mt-3 space-y-2">
            {visibleSiblings.length > 0 ? (
              <>
                {visibleSiblings.map((sibling) => (
                  <RelatedLocationLink key={sibling.id} location={sibling} />
                ))}
                {siblings.length > visibleSiblings.length && (
                  <p className="text-xs text-gray-500">
                    +{siblings.length - visibleSiblings.length} ακόμη σχετικές τοποθεσίες διαθέσιμες από τη λίστα τοποθεσιών.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-4 text-sm text-gray-500">
                Δεν υπάρχουν άλλες αδερφικές τοποθεσίες καταγεγραμμένες σε αυτό το επίπεδο.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Υποπεριοχές</h3>
          <p className="mt-1 text-sm text-gray-600">
            Συνέχισε πιο βαθιά στην ιεραρχία με τις πιο σχετικές υποπεριοχές.
          </p>
          <div className="mt-3 space-y-2">
            {visibleChildren.length > 0 ? (
              <>
                {visibleChildren.map((child) => (
                  <RelatedLocationLink key={child.id} location={child} tone="emerald" />
                ))}
                {children.length > visibleChildren.length && (
                  <p className="text-xs text-gray-500">
                    Εμφανίζονται οι πρώτες 6 από {children.length} υποπεριοχές.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-4 text-sm text-gray-500">
                Δεν έχουν προστεθεί ακόμη υποπεριοχές κάτω από το {location.name_local || location.name}.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
