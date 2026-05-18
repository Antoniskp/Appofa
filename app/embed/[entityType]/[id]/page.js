import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import EntityEmbedView from '@/components/embed/EntityEmbedView';
import {
  EMBED_ENTITY_CONFIG,
  parseEmbedEntityId,
} from '@/lib/utils/embed';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const ENTITY_API_PATHS = {
  polls: (id) => `/api/polls/${id}`,
  suggestions: (id) => `/api/suggestions/${id}`,
  'civic-questions': (id) => `/api/civic-questions/${id}`,
};

export const metadata = {
  // Embed routes are duplicate, iframe-oriented representations and should not be indexed.
  robots: {
    index: false,
    follow: false,
  },
};

async function fetchEmbeddedEntity(entityType, rawId) {
  const entityId = parseEmbedEntityId(rawId);
  if (!entityId) return { status: 404 };

  const response = await fetch(`${API_URL}${ENTITY_API_PATHS[entityType](entityId)}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return { status: response.status };
  }

  const payload = await response.json();
  if (!payload?.success || !payload.data) {
    return { status: 404 };
  }

  return { status: 200, data: payload.data };
}

function EmbeddedState({ title, description, href = '/', openLabel }) {
  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 rounded-[24px] border border-gray-200 bg-white px-6 py-10 text-center shadow-lg shadow-gray-200/80">
        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Appofasi embed
        </span>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="max-w-md text-sm leading-6 text-gray-600">{description}</p>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {openLabel}
        </Link>
      </div>
    </div>
  );
}

export default async function EmbeddedEntityPage({ params }) {
  const tCommon = await getTranslations('common');
  const { entityType, id } = await params;

  if (!EMBED_ENTITY_CONFIG[entityType]) {
    notFound();
  }

  const result = await fetchEmbeddedEntity(entityType, id);

  if (result.status === 404) {
    return (
      <EmbeddedState
        title="Το περιεχόμενο δεν βρέθηκε"
        description="Το ενσωματωμένο περιεχόμενο που ζητήσατε δεν είναι διαθέσιμο."
        openLabel={tCommon('open_in_app')}
      />
    );
  }

  if (result.status === 401 || result.status === 403) {
    return (
      <EmbeddedState
        title="Η ενσωμάτωση δεν είναι διαθέσιμη"
        description="Μόνο δημόσιο περιεχόμενο μπορεί να εμφανιστεί εκτός Appofa. Ανοίξτε το πλήρες αντικείμενο για να ελέγξετε τα δικαιώματα πρόσβασης."
        openLabel={tCommon('open_in_app')}
      />
    );
  }

  const entity = result.data;

  return (
    <EntityEmbedView
      entityType={entityType}
      entity={entity}
    />
  );
}
