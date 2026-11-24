import Link from 'next/link';

export default function LocationBreadcrumb({ breadcrumb, homeBreadcrumb }) {
  const home = homeBreadcrumb.at(-1);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <nav aria-label="Διαδρομή τοποθεσίας">
        <ol className="flex flex-wrap items-center gap-1 text-gray-600">
          {breadcrumb.map((place, index) => (
            <li key={place.id} className="flex items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === breadcrumb.length - 1
                ? <span aria-current="page" className="font-semibold text-gray-900">{place.name_local || place.name}</span>
                : <Link href={`/locations/${place.slug || place.id}`} className="hover:underline">{place.name_local || place.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      {home && <Link href={`/locations/${home.slug || home.id}`} className="font-medium text-blue-700 hover:underline">
        Η περιοχή μου · {home.name_local || home.name}
      </Link>}
    </div>
  );
}
