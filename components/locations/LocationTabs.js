import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { idSlug } from '@/lib/utils/slugify';
import UserRow from '@/components/user/UserRow';
import LoginLink from '@/components/ui/LoginLink';
import LocationElectionsTab from '@/components/locations/LocationElectionsTab';
import { VALID_TABS } from '@/lib/constants/locations';

const POSITION_LABELS = {
  mayor: 'Δήμαρχος',
  prefect: 'Περιφερειάρχης',
  parliamentary: 'Βουλευτής',
};

export default function LocationTabs({
  activeTab,
  onTabChange,
  activePolls,
  newsArticles,
  regularArticles,
  entities,
  suggestions,
  persons,
  isAuthenticated,
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
            <p className="text-center text-gray-500 py-8">No polls linked to this location yet.</p>
          ) : (
            <div className="space-y-3">
              {activePolls.map(poll => (
                <Link
                  key={poll.id}
                  href={`/polls/${idSlug(poll.id, poll.title)}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{poll.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="capitalize">{poll.status}</span>
                    {(poll.hideCreator || poll.creator?.username) && (
                      <>
                        <span>•</span>
                        <span>by {poll.hideCreator ? 'Anonymous' : poll.creator?.username}</span>
                      </>
                    )}
                    {poll.createdAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(poll.createdAt).toLocaleDateString('el-GR')}</span>
                      </>
                    )}
                  </div>
                </Link>
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
            <p className="text-center text-gray-500 py-8">No news linked to this location yet.</p>
          ) : (
            <div className="space-y-3">
              {newsArticles.map(article => (
                <Link
                  key={article.id}
                  href={`/news/${idSlug(article.id, article.title)}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {(article.hideAuthor || article.author?.username) && (
                      <span>by {article.hideAuthor ? 'Anonymous' : article.author?.username}</span>
                    )}
                    {article.createdAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(article.createdAt).toLocaleDateString('el-GR')}</span>
                      </>
                    )}
                  </div>
                </Link>
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
            <p className="text-center text-gray-500 py-8">No articles linked to this location yet.</p>
          ) : (
            <div className="space-y-3">
              {regularArticles.map(article => (
                <Link
                  key={article.id}
                  href={`/articles/${idSlug(article.id, article.title)}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                  {article.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{article.type}</span>
                    {(article.hideAuthor || article.author?.username) && (
                      <>
                        <span>•</span>
                        <span>by {article.hideAuthor ? 'Anonymous' : article.author?.username}</span>
                      </>
                    )}
                  </div>
                </Link>
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
                  const fullName = [person.firstNameNative, person.lastNameNative].filter(Boolean).join(' ') || person.username || 'Άγνωστο';
                  const claimBadge = person.claimStatus === 'unclaimed'
                    ? { label: 'Αδιεκδίκητο', cls: 'bg-amber-100 text-amber-700' }
                    : person.claimStatus === 'pending'
                      ? { label: 'Σε Αναμονή', cls: 'bg-blue-100 text-blue-700' }
                      : { label: 'Επαληθευμένο', cls: 'bg-green-100 text-green-700' };
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
            <p className="text-center text-gray-500 py-8">No suggestions linked to this location yet.</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map(suggestion => (
                <Link
                  key={suggestion.id}
                  href={`/suggestions/${suggestion.id}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-1">{suggestion.title}</h3>
                  {suggestion.body && (
                    <p className="text-sm text-gray-600 line-clamp-2">{suggestion.body}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="capitalize">{suggestion.type?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{suggestion.status?.replace('_', ' ')}</span>
                    {suggestion.author?.username && (
                      <>
                        <span>•</span>
                        <span>by {suggestion.author.username}</span>
                      </>
                    )}
                    {suggestion.createdAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(suggestion.createdAt).toLocaleDateString('el-GR')}</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Persons tab */}
        <div
          id="tabpanel-persons"
          role="tabpanel"
          aria-labelledby="tab-persons"
          hidden={activeTab !== 'persons'}
        >
          {loading ? (
            <p className="text-center text-gray-400 py-8 animate-pulse">Loading...</p>
          ) : persons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Δεν υπάρχουν πρόσωπα για αυτή την περιφέρεια.</p>
          ) : (
            <div className="space-y-3">
              {persons.map(person => (
                <Link
                  key={person.id}
                  href={`/persons/${person.slug}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{person.fullName}</h3>
                      {person.position && (
                        <p className="text-sm text-gray-500">
                          {POSITION_LABELS[person.position] || person.position}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
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
