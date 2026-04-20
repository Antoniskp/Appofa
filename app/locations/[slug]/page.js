'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { locationAPI, locationSectionAPI, suggestionAPI, personAPI, geoAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';
import LocationSections from '@/components/LocationSections';
import LocationRoles from '@/components/LocationRoles';
import LocationBreadcrumb from '@/components/locations/LocationBreadcrumb';
import LocationHeader from '@/components/locations/LocationHeader';
import LocationEditForm from '@/components/locations/LocationEditForm';
import LocationTabs from '@/components/locations/LocationTabs';
import CountryFundingBanner from '@/components/locations/CountryFundingBanner';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { VALID_TABS, ALWAYS_VISIBLE_TABS, DEFAULT_TAB, HEADER_SECTION_TYPES } from '@/lib/constants/locations';

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { canManageLocations } = usePermissions();
  const isAuthenticated = !authLoading && !!user;
  const [entities, setEntities] = useState({ articles: [], users: [], polls: [], usersCount: 0, unclaimed: [], unclaimedCount: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [persons, setPersons] = useState([]);
  const [children, setChildren] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [homeBreadcrumb, setHomeBreadcrumb] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [imageError, setImageError] = useState(false);
  const [sections, setSections] = useState([]);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [fundingData, setFundingData] = useState(null);
  const [fundingLoaded, setFundingLoaded] = useState(false);

  // Derive active tab from URL query param
  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : DEFAULT_TAB;

  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', tab);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const { data: location, loading, error, refetch } = useAsyncData(
    async () => {
      const locationResponse = await locationAPI.getById(params.slug);
      if (!locationResponse.success) {
        throw new Error('Location not found');
      }
      return locationResponse.location;
    },
    [params.slug],
    {
      onSuccess: async (loc) => {
        // Reset secondary state to prevent stale data from previous location
        setEntities({ articles: [], users: [], polls: [], usersCount: 0, unclaimed: [], unclaimedCount: 0 });
        setSuggestions([]);
        setPersons([]);
        setChildren([]);
        setSections([]);
        setImageError(false);
        setIsEditing(false);
        setFundingData(null);
        setFundingLoaded(false);
        setSecondaryLoading(true);

        // Build breadcrumb
        const crumbs = [];
        let current = loc;
        while (current) {
          crumbs.unshift(current);
          current = current.parent;
        }
        setBreadcrumb(crumbs);

        // Initialize edited data
        setEditedData({
          name: loc.name,
          name_local: loc.name_local || '',
          code: loc.code || '',
          lat: loc.lat || '',
          lng: loc.lng || '',
          wikipedia_url: loc.wikipedia_url || '',
        });

        // Use the resolved numeric ID for subsequent queries
        const locId = loc.id;

        // Fetch all secondary data in parallel
        const [entitiesRes, childrenRes, sectionsRes, suggestionsRes, personsRes] =
          await Promise.allSettled([
            locationAPI.getLocationEntities(locId),
            locationAPI.getAll({ parent_id: locId }),
            locationSectionAPI.getSections(locId),
            suggestionAPI.getAll({ locationId: locId, limit: 50 }),
            personAPI.getAll({ constituencyId: locId, limit: 50 }),
          ]);

        if (entitiesRes.status === 'fulfilled' && entitiesRes.value.success) {
          setEntities({
            articles: entitiesRes.value.articles || [],
            users: entitiesRes.value.users || [],
            polls: entitiesRes.value.polls || [],
            usersCount: entitiesRes.value.usersCount || 0,
            unclaimed: entitiesRes.value.unclaimed || [],
            unclaimedCount: entitiesRes.value.unclaimedCount || 0,
          });
        } else if (entitiesRes.status === 'rejected') {
          console.error('Failed to load entities:', entitiesRes.reason);
        }

        if (childrenRes.status === 'fulfilled' && childrenRes.value.success) {
          setChildren(childrenRes.value.locations || []);
        } else if (childrenRes.status === 'rejected') {
          console.error('Failed to load child locations:', childrenRes.reason);
        }

        if (sectionsRes.status === 'fulfilled' && sectionsRes.value.success) {
          setSections(sectionsRes.value.sections || []);
        } else if (sectionsRes.status === 'rejected') {
          console.error('Failed to load sections:', sectionsRes.reason);
        }

        if (suggestionsRes.status === 'fulfilled' && suggestionsRes.value.success) {
          setSuggestions(suggestionsRes.value.data || []);
        } else if (suggestionsRes.status === 'rejected') {
          console.error('Failed to load suggestions:', suggestionsRes.reason);
        }

        if (personsRes.status === 'fulfilled' && personsRes.value.success) {
          setPersons(personsRes.value.data?.profiles || []);
        } else if (personsRes.status === 'rejected') {
          console.error('Failed to load persons:', personsRes.reason);
        }

        setSecondaryLoading(false);
        if (loc.type === 'country') {
          geoAPI.getCountryFunding(loc.id)
            .then((res) => { if (res?.success) setFundingData(res.data); })
            .catch(() => {})
            .finally(() => setFundingLoaded(true));
        } else {
          setFundingLoaded(true);
        }
      },
      onError: (err) => {
        console.error('Failed to load location:', err);
        toastError(err || 'Location not found');
      }
    }
  );

  // Redirect numeric-ID URLs to canonical slug URLs
  useEffect(() => {
    if (!location?.slug) return;
    if (/^\d+$/.test(params.slug) && location.slug !== params.slug) {
      router.replace(`/locations/${location.slug}`);
    }
  }, [location, params.slug, router]);

  // Build home breadcrumb from user's homeLocation (full parent chain)
  const homeLocationSlug = user?.homeLocation?.slug;
  useEffect(() => {
    if (!homeLocationSlug) {
      setHomeBreadcrumb([]);
      return;
    }
    locationAPI.getById(homeLocationSlug).then((res) => {
      if (!res.success) return;
      const crumbs = [];
      let current = res.location;
      while (current) {
        crumbs.unshift(current);
        current = current.parent;
      }
      setHomeBreadcrumb(crumbs);
    }).catch(() => {});
  }, [homeLocationSlug]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset edited data to original values
    if (location) {
      setEditedData({
        name: location.name,
        name_local: location.name_local || '',
        code: location.code || '',
        lat: location.lat || '',
        lng: location.lng || '',
        wikipedia_url: location.wikipedia_url || '',
      });
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!location) return;

    // Validate required field
    if (!editedData.name || !editedData.name.trim()) {
      toastError('Location name is required');
      return;
    }

    // Validate coordinates
    const lat = editedData.lat !== '' ? parseFloat(editedData.lat) : null;
    const lng = editedData.lng !== '' ? parseFloat(editedData.lng) : null;

    if (editedData.lat !== '' && (isNaN(lat) || lat < -90 || lat > 90)) {
      toastError('Latitude must be a number between -90 and 90');
      return;
    }

    if (editedData.lng !== '' && (isNaN(lng) || lng < -180 || lng > 180)) {
      toastError('Longitude must be a number between -180 and 180');
      return;
    }

    // Validate Wikipedia URL if provided
    if (editedData.wikipedia_url && editedData.wikipedia_url.trim()) {
      try {
        const url = new URL(editedData.wikipedia_url);
        if (!url.hostname.endsWith('.wikipedia.org')) {
          toastError('Wikipedia URL must be from a Wikipedia domain (e.g., en.wikipedia.org)');
          return;
        }
      } catch {
        toastError('Please enter a valid Wikipedia URL');
        return;
      }
    }

    setIsSaving(true);
    try {
      const updateData = {
        name: editedData.name.trim(),
        name_local: editedData.name_local.trim() || null,
        code: editedData.code.trim() || null,
        lat,
        lng,
        wikipedia_url: editedData.wikipedia_url.trim() || null,
      };

      const response = await locationAPI.update(location.id, updateData);
      
      if (response.success) {
        toastSuccess('Location updated successfully');
        setIsEditing(false);
        // Refetch the location data
        await refetch();
      } else {
        toastError(response.message || 'Failed to update location');
      }
    } catch (err) {
      console.error('Failed to update location:', err);
      toastError(err.message || 'Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-600">Loading location...</p>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-red-600 mb-4">{error || 'Location not found'}</p>
        <Link href="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </div>
    );
  }

  // Separate articles into news and regular articles (single iteration)
  const { newsArticles, regularArticles } = entities.articles.reduce(
    (acc, article) => {
      if (article.type === 'news') {
        acc.newsArticles.push(article);
      } else {
        acc.regularArticles.push(article);
      }
      return acc;
    },
    { newsArticles: [], regularArticles: [] }
  );

  // Filter out archived polls (single iteration)
  const activePolls = entities.polls.filter(poll => poll.status !== 'archived');
  const hasContent = entities.articles.length > 0 || entities.polls.length > 0 || suggestions.length > 0;

  const TAB_LABELS = {
    polls: `Ψηφοφορίες${activePolls.length ? ` (${activePolls.length})` : ''}`,
    news: `Ειδήσεις${newsArticles.length ? ` (${newsArticles.length})` : ''}`,
    articles: `Άρθρα${regularArticles.length ? ` (${regularArticles.length})` : ''}`,
    users: `Χρήστες${entities.usersCount ? ` (${entities.usersCount})` : ''}`,
    unclaimed: `Αδιεκδίκητα${entities.unclaimedCount ? ` (${entities.unclaimedCount})` : ''}`,
    suggestions: `Προτάσεις${suggestions.length ? ` (${suggestions.length})` : ''}`,
    persons: `Πρόσωπα${persons.length ? ` (${persons.length})` : ''}`,
    elections: '🗳️ Εκλογές',
  };

  // Determine which tabs have content (for hiding empty tabs)
  const TAB_COUNTS = {
    polls: activePolls.length,
    news: newsArticles.length,
    articles: regularArticles.length,
    users: entities.usersCount,
    unclaimed: entities.unclaimedCount,
    suggestions: suggestions.length,
    persons: persons.length,
    elections: 1,
  };
  const visibleTabs = secondaryLoading
    ? VALID_TABS
    : [
      ...VALID_TABS.filter(tab => !ALWAYS_VISIBLE_TABS.includes(tab) && TAB_COUNTS[tab] > 0),
      ...ALWAYS_VISIBLE_TABS,
    ].sort((a, b) => VALID_TABS.indexOf(a) - VALID_TABS.indexOf(b));
  // If current active tab is hidden, fall back to first visible tab
  const resolvedActiveTab = visibleTabs.includes(activeTab)
    ? activeTab
    : (visibleTabs[0] ?? DEFAULT_TAB);

  const bodySections = sections.filter(s => s.isPublished && !HEADER_SECTION_TYPES.includes(s.type));

  // Merge all news_sources sections into a single one to prevent duplicate boxes
  const mergedBodySections = (() => {
    const { newsSections, otherSections } = bodySections.reduce(
      (acc, s) => {
        if (s.type === 'news_sources') acc.newsSections.push(s);
        else acc.otherSections.push(s);
        return acc;
      },
      { newsSections: [], otherSections: [] }
    );
    if (newsSections.length <= 1) return bodySections;
    const merged = {
      ...newsSections[0],
      content: {
        sources: newsSections.flatMap(s => s.content?.sources || [])
      }
    };
    return [...otherSections, merged];
  })();

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <LocationBreadcrumb breadcrumb={breadcrumb} homeBreadcrumb={homeBreadcrumb} />

        {/* Compact Location Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {isEditing ? (
            <LocationEditForm
              location={location}
              editedData={editedData}
              isSaving={isSaving}
              onSave={handleSave}
              onCancel={handleCancelEdit}
              onInputChange={handleInputChange}
            />
          ) : (
            <LocationHeader
              location={location}
              sections={sections}
              children={children}
              activePolls={activePolls}
              newsArticles={newsArticles}
              regularArticles={regularArticles}
              entities={entities}
              imageError={imageError}
              setImageError={setImageError}
              canManageLocations={canManageLocations}
              onEdit={handleEdit}
            />
          )}
        </div>

        {/* Location Sections (published, non-header types) — shown between header and tabs */}
        {!isEditing && (
          <div className="mb-6">
            {secondaryLoading ? (
              <SkeletonLoader type="card" count={2} />
            ) : mergedBodySections.length > 0 ? (
              <LocationSections sections={mergedBodySections} />
            ) : null}
          </div>
        )}

        {/* Location Roles — assigned officials for this location */}
        {!isEditing && location && (
          <div className="mb-6">
            <LocationRoles locationId={location.id} />
          </div>
        )}

        {/* Tabbed content — only shown when not editing */}
        {!isEditing && (
          <>
            {location?.type === 'country' && fundingLoaded && (
              <div className="mb-6">
                <CountryFundingBanner
                  funding={fundingData}
                  locationName={location.name_local || location.name}
                  hasContent={hasContent}
                />
              </div>
            )}
          <LocationTabs
            activeTab={resolvedActiveTab}
            onTabChange={handleTabChange}
            activePolls={activePolls}
            newsArticles={newsArticles}
            regularArticles={regularArticles}
            entities={entities}
            suggestions={suggestions}
            persons={persons}
            isAuthenticated={isAuthenticated}
            TAB_LABELS={TAB_LABELS}
            visibleTabs={visibleTabs}
            loading={secondaryLoading}
            electionData={{
              locationId: location.id,
              locationType: location.type,
              isAuthenticated,
              currentUserId: user?.id ?? null,
            }}
          />
          </>
        )}
      </div>
    </div>
  );
}
