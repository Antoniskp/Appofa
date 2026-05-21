'use client';

import Link from 'next/link';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';

function OrganizationTypeBadge({ type, t }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
      {t(`type_${type}`)}
    </span>
  );
}

export default function OrganizationCard({ organization }) {
  const t = useTranslations('organizations');
  return (
    <Link href={`/organizations/${organization.slug}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden h-full">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {organization.logo ? (
            <img src={organization.logo} alt={organization.name} className="h-14 w-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <BuildingOffice2Icon className="h-7 w-7 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{organization.name}</h2>
              <OrganizationTypeBadge type={organization.type} t={t} />
            </div>
            {organization.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{organization.description}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
