import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { idSlug } from '@/lib/utils/slugify';
import UserRow from '@/components/user/UserRow';
import LoginLink from '@/components/ui/LoginLink';
import LocationElectionsTab from '@/components/locations/LocationElectionsTab';
import { VALID_TABS } from '@/lib/constants/locations';

const CLAIM_STATUS_BADGES = {
  unclaimed: { label: 'Αδιεκδίκητο', cls: 'bg-amber-100 text-amber-700' },
  pending: { label: 'Σε Αναμονή', cls: 'bg-blue-100 text-blue-700' },
  claimed: { label: 'Επαληθευμένο', cls: 'bg-green-100 text-green-700' },
};

const SUGGESTION_TYPE_BADGES = {
  improvement: 'bg-blue-50 text-blue-700 border-blue-200',
  complaint: 'bg-rose-50 text-rose-700 border-rose-200',
  issue: 'bg-amber-50 text-amber-700 border-amber-200',
  request: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const SUGGESTION_STATUS_BADGES = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  in_review: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
};

const POLL_STATUS_BADGES = {
  open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
};

function formatMetaDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleDateString('el-GR');
}

function FeedItem({ href, title, excerpt, badges = [], metadata = [] }) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
    >
      {badges.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {badges.map((badge) => (
            <span
              key={`${badge.label}-${badge.className}`}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge.className}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{title}</h3>
      {excerpt && (
        <p className="mt-1.5 text-sm leading-6 text-gray-600 line-clamp-2">{excerpt}</p>
      )}
      {metadata.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {metadata.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
    </Link>
  );
}

function TabEmptyState({ title, description, actions = [] }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-5 py-8 text-center">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">{description}</p>
      {actions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {actions.map((action) => {
            const className = action.variant === 'secondary'
              ? 'inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors'
              : 'inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors';

            return (
              <Link key={`${action.href}-${action.label}`} href={action.href} className={className}>
                {action.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LocationTabs({
  activeTab,
  onTabChange,
  activePolls,
  newsArticles,
  regularArticles,
  entities,
  suggestions,
  isAuthenticated,
  locationIdentifier,
  canManageLocations = false,
  TAB_LABELS,
  visibleTabs,
  loading,
  electionData,
}) {
  // Fall back to all tabs if visibleTabs not provided (e.g. during initial load)
  const tabs = visibleTabs && visibleTabs.length > 0 ? visibleTabs : VALID_TABS;

  // If no tabs have content (and we're not loading), show an empty state
  if (!loading && visibleTabs?.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center" role="status">
        <p className="text-gray-400 text-sm">Δεν υπάρχει περιεχόμενο για αυτή την τοποθεσία ακόμα.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Tab bar */}
      <div
        className="flex border-b border-gray-200 overflow-x-auto"
        role="tablist"
        aria-label="Location content tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab}`}
            id={`tab-${tab}`}
            onClick={() => onTabChange(tab)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(tab);
              }
              if (e.key === 'ArrowRight') {
                const next = tabs[(tabs.indexOf(tab) + 1) % tabs.length];
                onTabChange(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
              if (e.key === 'ArrowLeft') {
                const prev = tabs[(tabs.indexOf(tab) - 1 + tabs.length) % tabs.length];
                onTabChange(prev);
                document.getElementById(`tab-${prev}`)?.focus();
              }
            }}
            className={`flex-shrink-0 px-5 py-3 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="p-6">
        {/* Polls tab */}
        <div
          id="tabpanel-polls"
          role="tabpanel"
          aria-labelledby="tab-polls"
          hidden={activeTab !== 'polls'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : activePolls.length === 0 ? (
            <TabEmptyState
              title="Δεν υπάρχουν ακόμη ψηφοφορίες"
              description={
                canManageLocations
                  ? 'Δεν έχει συνδεθεί ακόμη κάποια τοπική ψηφοφορία. Μπορείς να δημιουργήσεις μία νέα ή να επιστρέψεις αργότερα όταν δημοσιευτεί σχετικό περιεχόμενο.'
                  : 'Δεν έχει συνδεθεί ακόμη κάποια τοπική ψηφοφορία για αυτή την περιοχή.'
              }
              actions={[
                { href: '/polls/create', label: 'Δημιούργησε ψηφοφορία' },
                { href: `/locations/${locationIdentifier}?tab=suggestions#location-content`, label: 'Δες προτάσεις', variant: 'secondary' },
              ]}
            />
          ) : (
            <div className="space-y-4">
              {activePolls.map(poll => (
                <FeedItem
                  key={poll.id}
                  href={`/polls/${idSlug(poll.id, poll.title)}`}
                  title={poll.title}
                  excerpt={poll.description}
                  badges={[
                    { label: 'Poll', className: 'bg-sky-50 text-sky-700 border-sky-200' },
                    { label: poll.status || 'open', className: POLL_STATUS_BADGES[poll.status] || 'bg-gray-100 text-gray-700 border-gray-200' },
                  ]}
                  metadata={[
                    poll.hideCreator || poll.creator?.username
                      ? `by ${poll.hideCreator ? 'Anonymous' : poll.creator?.username}`
                      : null,
                    formatMetaDate(poll.createdAt),
                  ].filter(Boolean)}
                />
              ))}
            </div>
          )}
        </div>

        {/* News tab */}
        <div
          id="tabpanel-news"
          role="tabpanel"
          aria-labelledby="tab-news"
          hidden={activeTab !== 'news'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : newsArticles.length === 0 ? (
            <TabEmptyState
              title="Δεν υπάρχουν ακόμη τοπικές ειδήσεις"
              description="Δεν έχει συνδεθεί ακόμη ειδησεογραφικό περιεχόμενο με αυτή την τοποθεσία. Δες τις τοπικές πληροφορίες και τα μέσα ενημέρωσης για περισσότερα σημεία αναφοράς."
              actions={[
                { href: '#location-local-info', label: 'Τοπικές πληροφορίες', variant: 'secondary' },
              ]}
            />
          ) : (
            <div className="space-y-4">
              {newsArticles.map(article => (
                <FeedItem
                  key={article.id}
                  href={`/news/${idSlug(article.id, article.title)}`}
                  title={article.title}
                  excerpt={article.summary}
                  badges={[
                    { label: 'News', className: 'bg-purple-50 text-purple-700 border-purple-200' },
                  ]}
                  metadata={[
                    article.hideAuthor || article.author?.username
                      ? `by ${article.hideAuthor ? 'Anonymous' : article.author?.username}`
                      : null,
                    formatMetaDate(article.createdAt),
                  ].filter(Boolean)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Articles tab */}
        <div
          id="tabpanel-articles"
          role="tabpanel"
          aria-labelledby="tab-articles"
          hidden={activeTab !== 'articles'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : regularArticles.length === 0 ? (
            <TabEmptyState
              title="Δεν υπάρχουν ακόμη άρθρα"
              description="Δεν έχουν συνδεθεί ακόμη άρθρα ανάλυσης ή γνώμης για αυτή την τοποθεσία."
              actions={[
                { href: '#location-overview', label: 'Επιστροφή στη σύνοψη', variant: 'secondary' },
              ]}
            />
          ) : (
            <div className="space-y-4">
              {regularArticles.map(article => (
                <FeedItem
                  key={article.id}
                  href={`/articles/${idSlug(article.id, article.title)}`}
                  title={article.title}
                  excerpt={article.summary}
                  badges={[
                    { label: article.type || 'article', className: 'bg-green-50 text-green-700 border-green-200' },
                  ]}
                  metadata={[
                    article.hideAuthor || article.author?.username
                      ? `by ${article.hideAuthor ? 'Anonymous' : article.author?.username}`
                      : null,
                    formatMetaDate(article.createdAt),
                  ].filter(Boolean)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Users tab */}
        <div
          id="tabpanel-users"
          role="tabpanel"
          aria-labelledby="tab-users"
          hidden={activeTab !== 'users'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : entities.usersCount === 0 ? (
            <p className="text-center text-gray-500 py-8">No users linked to this location yet.</p>
          ) : isAuthenticated ? (
            entities.users.length > 0 ? (
              <div className="space-y-1 border border-gray-200 rounded-md divide-y divide-gray-100">
                {entities.users.map(u => (
                  <UserRow key={u.id} user={u} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No visible users to display.</p>
            )
          ) : (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Sign in or register to view {entities.usersCount} users from this location.
              </p>
              <div className="flex gap-3">
                <LoginLink
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Log In
                </LoginLink>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Unclaimed persons tab */}
        <div
          id="tabpanel-unclaimed"
          role="tabpanel"
          aria-labelledby="tab-unclaimed"
          hidden={activeTab !== 'unclaimed'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : entities.unclaimedCount === 0 ? (
            <p className="text-center text-gray-500 py-8">Δεν υπάρχουν αδιεκδίκητα πρόσωπα σε αυτή την τοποθεσία.</p>
          ) : isAuthenticated ? (
            entities.unclaimed.length > 0 ? (
              <div className="space-y-1 border border-gray-200 rounded-md divide-y divide-gray-100">
                {entities.unclaimed.map(person => {
                  const fullName = [person.firstNameNative, person.lastNameNative]
                    .filter(v => v?.trim())
                    .join(' ')
                    .trim() || person.username?.trim() || 'Άγνωστο';
                  const claimBadge = CLAIM_STATUS_BADGES[person.claimStatus] || CLAIM_STATUS_BADGES.claimed;
                  const content = (
                    <div className="flex items-center gap-4 px-4 py-3">
                      {person.photo
                        ? <img src={person.photo} alt={fullName} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                        : <UserCircleIcon className="h-10 w-10 text-gray-300 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{fullName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${claimBadge.cls}`}>{claimBadge.label}</span>
                        </div>
                        {person.username && <p className="text-xs text-gray-500">@{person.username}</p>}
                      </div>
                    </div>
                  );
                  return person.slug ? (
                    <Link key={person.id} href={`/persons/${person.slug}`} className="block hover:bg-gray-50 transition-colors rounded-lg">{content}</Link>
                  ) : (
                    <div key={person.id}>{content}</div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Δεν υπάρχουν ορατά πρόσωπα.</p>
            )
          ) : (
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                Συνδεθείτε για να δείτε {entities.unclaimedCount} αδιεκδίκητα πρόσωπα από αυτή την τοποθεσία.
              </p>
              <div className="flex gap-3">
                <LoginLink className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Σύνδεση
                </LoginLink>
                <Link href="/register" className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
                  Εγγραφή
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions tab */}
        <div
          id="tabpanel-suggestions"
          role="tabpanel"
          aria-labelledby="tab-suggestions"
          hidden={activeTab !== 'suggestions'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : suggestions.length === 0 ? (
            <TabEmptyState
              title="Δεν υπάρχουν ακόμη προτάσεις"
              description={
                canManageLocations
                  ? 'Δεν έχει ανοίξει ακόμη κάποια οργανωμένη πρόταση για αυτή την περιοχή. Μπορείς να ξεκινήσεις τη συζήτηση με μια νέα πρόταση.'
                  : 'Δεν έχει ανοίξει ακόμη κάποια οργανωμένη πρόταση για αυτή την περιοχή.'
              }
              actions={[
                { href: '/suggestions/new', label: 'Δημιούργησε πρόταση' },
                { href: '#location-related', label: 'Δες σχετικές τοποθεσίες', variant: 'secondary' },
              ]}
            />
          ) : (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <FeedItem
                  key={suggestion.id}
                  href={`/suggestions/${suggestion.id}`}
                  title={suggestion.title}
                  excerpt={suggestion.body}
                  badges={[
                    {
                      label: suggestion.type?.replace('_', ' ') || 'suggestion',
                      className: SUGGESTION_TYPE_BADGES[suggestion.type] || 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    },
                    {
                      label: suggestion.status?.replace('_', ' ') || 'open',
                      className: SUGGESTION_STATUS_BADGES[suggestion.status] || 'bg-gray-100 text-gray-700 border-gray-200'
                    },
                  ]}
                  metadata={[
                    suggestion.author?.username ? `by ${suggestion.author.username}` : null,
                    formatMetaDate(suggestion.createdAt),
                  ].filter(Boolean)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Elections tab */}
        <div
          id="tabpanel-elections"
          role="tabpanel"
          aria-labelledby="tab-elections"
          hidden={activeTab !== 'elections'}
        >
          {activeTab === 'elections' && electionData && (
            <LocationElectionsTab
              locationId={electionData.locationId}
              locationType={electionData.locationType}
              isAuthenticated={electionData.isAuthenticated}
              currentUserId={electionData.currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
