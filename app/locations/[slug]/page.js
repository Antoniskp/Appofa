'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { locationAPI, locationSectionAPI, suggestionAPI, geoAPI, candidateRegistrationAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { useAsyncData } from '@/hooks/useAsyncData';
import { usePermissions } from '@/hooks/usePermissions';
import LocationSections from '@/components/LocationSections';
import LocationRoles from '@/components/LocationRoles';
import LocationActionSummary from '@/components/locations/LocationActionSummary';
import LocationBreadcrumb from '@/components/locations/LocationBreadcrumb';
import LocationHeader from '@/components/locations/LocationHeader';
import LocationEditForm from '@/components/locations/LocationEditForm';
import LocationTabs from '@/components/locations/LocationTabs';
import CountryFundingBanner from '@/components/locations/CountryFundingBanner';
import LocationMap from '@/components/locations/LocationMap';
import LocationChildrenExplorer from '@/components/locations/LocationChildrenExplorer';
import CommentsThread from '@/components/comments/CommentsThread';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import LoginLink from '@/components/ui/LoginLink';
import { VALID_TABS, ALWAYS_VISIBLE_TABS, DEFAULT_TAB, HEADER_SECTION_TYPES } from '@/lib/constants/locations';
import { MAP_ISSUE_TYPES } from '@/lib/constants/mapIssues';

const DEFAULT_MAP_ISSUE_FORM = {
  mapIssueType: 'pothole',
  title: '',
  body: '',
  hideCreator: false,
};

export async function buildLocationBreadcrumb(locationIdOrSlug) {
  const crumbs = [];
  const visitedKeys = new Set();

  let response = await locationAPI.getById(locationIdOrSlug);
  if (!response?.success || !response.location) {
    return [];
  }

  let current = response.location;
  while (current) {
    const currentKey = current.id ? `id:${current.id}` : current.slug ? `slug:${current.slug}` : null;
    if (currentKey && visitedKeys.has(currentKey)) break;
    if (currentKey) visitedKeys.add(currentKey);
    crumbs.unshift(current);

    if (current.parent) {
      current = current.parent;
      continue;
    }

    const parentId = current.parent_id ?? current.parentId;
    if (!parentId || visitedKeys.has(`id:${parentId}`)) break;

    response = await locationAPI.getById(parentId);
    if (!response?.success || !response.location) break;
    current = response.location;
  }

  return crumbs;
}

function hasMapGeometry(locationLike) {
  return Boolean(
    (locationLike?.lat && locationLike?.lng)
    || locationLike?.boundary_geojson
  );
}

export function shouldShowMainLocationMap({ location, children = [], secondaryLoading = false } = {}) {
  const hasOwnGeometry = hasMapGeometry(location);
  const hasChildGeometry = children.some(hasMapGeometry);

  // Parent pages with mapped children already get a richer hierarchy map below.
  // While child data is loading, wait so the page does not briefly show two map slots.
  if (secondaryLoading || hasChildGeometry) return false;

  return hasOwnGeometry;
}

function LocationPageNav({ items }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Πλοήγηση σελίδας τοποθεσίας"
      className="sticky top-16 z-20 mb-6 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur"
    >
      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Σελίδα
        </span>
        <div className="flex min-w-max items-center gap-2">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

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
  const [candidates, setCandidates] = useState([]);
  const [children, setChildren] = useState([]);
  const [siblings, setSiblings] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [homeBreadcrumb, setHomeBreadcrumb] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [boundaryValidation, setBoundaryValidation] = useState({ isValid: true });
  const [imageError, setImageError] = useState(false);
  const [sections, setSections] = useState([]);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  const [fundingData, setFundingData] = useState(null);
  const [fundingLoaded, setFundingLoaded] = useState(false);
  const [mapIssuePin, setMapIssuePin] = useState(null);
  const [mapIssueForm, setMapIssueForm] = useState(DEFAULT_MAP_ISSUE_FORM);
  const [isSubmittingMapIssue, setIsSubmittingMapIssue] = useState(false);

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
        setCandidates([]);
        setChildren([]);
        setSiblings([]);
        setSections([]);
        setImageError(false);
        setIsEditing(false);
        setMapIssuePin(null);
        setMapIssueForm(DEFAULT_MAP_ISSUE_FORM);
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
          population_override: loc.population_override != null ? String(loc.population_override) : '',
          boundary_geojson: loc.boundary_geojson || null,
          boundary_color: loc.boundary_color || '',
          map_default_center_lat: loc.map_default_center_lat != null ? String(loc.map_default_center_lat) : '',
          map_default_center_lng: loc.map_default_center_lng != null ? String(loc.map_default_center_lng) : '',
          map_default_zoom: loc.map_default_zoom != null ? String(loc.map_default_zoom) : '',
        });
        setBoundaryValidation({ isValid: true });

        // Use the resolved numeric ID for subsequent queries
        const locId = loc.id;
        // Fetch all secondary data in parallel
        const [entitiesRes, childrenRes, sectionsRes, suggestionsRes, siblingsRes, candidatesRes] =
          await Promise.allSettled([
            // 0: linked entities/content
            locationAPI.getLocationEntities(locId),
            // 1: direct children (sort=mostUsers ensures userCount is included in the response)
            locationAPI.getAll({ parent_id: locId, sort: 'mostUsers' }),
            // 2: published location sections
            locationSectionAPI.getSections(locId),
            // 3: suggestions feed
            suggestionAPI.getAll({ locationId: locId, limit: 50 }),
            // 4: sibling locations (same parent)
            loc.parent?.id ? locationAPI.getAll({ parent_id: loc.parent.id }) : Promise.resolve({ success: true, locations: [] }),
            // 5: candidate registrations scoped to this location tree
            candidateRegistrationAPI.getAll({ locationId: locId, limit: 50 }),
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

        if (siblingsRes.status === 'fulfilled' && siblingsRes.value.success) {
          setSiblings((siblingsRes.value.locations || []).filter((item) => item.id !== locId));
        } else if (siblingsRes.status === 'rejected') {
          console.error('Failed to load sibling locations:', siblingsRes.reason);
        }

        if (candidatesRes.status === 'fulfilled' && candidatesRes.value.success) {
          setCandidates(candidatesRes.value.data?.registrations || []);
        } else if (candidatesRes.status === 'rejected') {
          console.error('Failed to load candidate registrations:', candidatesRes.reason);
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
  const homeLocationKey = user?.homeLocation?.id ?? user?.homeLocation?.slug;
  useEffect(() => {
    if (authLoading) return;
    if (!homeLocationKey) {
      setHomeBreadcrumb([]);
      return;
    }

    let cancelled = false;
    buildLocationBreadcrumb(homeLocationKey).then((crumbs) => {
      if (!cancelled) {
        setHomeBreadcrumb(crumbs);
      }
    }).catch(() => {
      if (!cancelled) {
        setHomeBreadcrumb([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, homeLocationKey]);

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
        population_override: location.population_override != null ? String(location.population_override) : '',
        boundary_geojson: location.boundary_geojson || null,
        boundary_color: location.boundary_color || '',
        map_default_center_lat: location.map_default_center_lat != null ? String(location.map_default_center_lat) : '',
        map_default_center_lng: location.map_default_center_lng != null ? String(location.map_default_center_lng) : '',
        map_default_zoom: location.map_default_zoom != null ? String(location.map_default_zoom) : '',
      });
      setBoundaryValidation({ isValid: true });
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

    const mapDefaultCenterLat = editedData.map_default_center_lat !== '' ? parseFloat(editedData.map_default_center_lat) : null;
    const mapDefaultCenterLng = editedData.map_default_center_lng !== '' ? parseFloat(editedData.map_default_center_lng) : null;
    const mapDefaultZoom = editedData.map_default_zoom !== '' ? parseInt(editedData.map_default_zoom, 10) : null;

    if (editedData.map_default_center_lat !== '' && (isNaN(mapDefaultCenterLat) || mapDefaultCenterLat < -90 || mapDefaultCenterLat > 90)) {
      toastError('Default map center latitude must be between -90 and 90');
      return;
    }
    if (editedData.map_default_center_lng !== '' && (isNaN(mapDefaultCenterLng) || mapDefaultCenterLng < -180 || mapDefaultCenterLng > 180)) {
      toastError('Default map center longitude must be between -180 and 180');
      return;
    }
    if (editedData.map_default_zoom !== '' && (isNaN(mapDefaultZoom) || mapDefaultZoom < 1 || mapDefaultZoom > 18)) {
      toastError('Default map zoom must be an integer between 1 and 18');
      return;
    }
    const hasDefaultLat = mapDefaultCenterLat != null;
    const hasDefaultLng = mapDefaultCenterLng != null;
    if (hasDefaultLat !== hasDefaultLng) {
      toastError('Default map center requires both latitude and longitude');
      return;
    }
    if ((hasDefaultLat || hasDefaultLng) && mapDefaultZoom == null) {
      toastError('Default map zoom is required when default center is set');
      return;
    }
    if (!hasDefaultLat && !hasDefaultLng && mapDefaultZoom != null) {
      toastError('Default map zoom requires default center latitude and longitude');
      return;
    }

    if (!boundaryValidation.isValid) {
      toastError('Please fix Boundary / GeoJSON validation errors before saving.');
      return;
    }

    if (editedData.boundary_color && !/^#[0-9A-Fa-f]{6}$/.test(editedData.boundary_color.trim())) {
      toastError('Boundary color must be a HEX value like #3b82f6');
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
        boundary_geojson: editedData.boundary_geojson || null,
        boundary_color: editedData.boundary_color.trim() || null,
        map_default_center_lat: mapDefaultCenterLat,
        map_default_center_lng: mapDefaultCenterLng,
        map_default_zoom: mapDefaultZoom,
        population_override: (() => {
          if (editedData.population_override === '') return null;
          const v = parseInt(editedData.population_override, 10);
          return isNaN(v) ? null : v;
        })(),
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

  const handleMapIssueTypeChange = (mapIssueType) => {
    setMapIssueForm((prev) => ({ ...prev, mapIssueType }));
    setMapIssuePin((prev) => (prev ? { ...prev, mapIssueType } : prev));
  };

  const handleMapIssueMapClick = (lat, lng) => {
    if (!isAuthenticated) return;
    setMapIssuePin({
      lat,
      lng,
      mapIssueType: mapIssueForm.mapIssueType || DEFAULT_MAP_ISSUE_FORM.mapIssueType,
    });
  };

  const handleSubmitMapIssue = async (event) => {
    event.preventDefault();
    if (!location) return;
    if (!isAuthenticated) {
      toastError('Please sign in to post a local issue.');
      return;
    }
    if (!mapIssuePin) {
      toastError('Select a point on the map first.');
      return;
    }

    const title = mapIssueForm.title.trim();
    const body = mapIssueForm.body.trim();
    if (title.length < 5) {
      toastError('Title must be at least 5 characters.');
      return;
    }
    if (body.length < 10) {
      toastError('Details must be at least 10 characters.');
      return;
    }

    setIsSubmittingMapIssue(true);
    try {
      const response = await suggestionAPI.create({
        title,
        body,
        type: 'problem',
        locationId: location.id,
        visibility: 'public',
        voteRestriction: 'locals_only',
        category: 'map_issue',
        mapLat: mapIssuePin.lat,
        mapLng: mapIssuePin.lng,
        mapIssueType: mapIssueForm.mapIssueType || 'other',
        hideCreator: mapIssueForm.hideCreator,
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to post local issue.');
      }

      setSuggestions((prev) => [response.data, ...prev]);
      setMapIssuePin(null);
      setMapIssueForm(DEFAULT_MAP_ISSUE_FORM);
      toastSuccess('Local issue posted.');
    } catch (err) {
      console.error('Failed to post local issue:', err);
      toastError(err.message || 'Failed to post local issue.');
    } finally {
      setIsSubmittingMapIssue(false);
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
  const mapIssueSuggestions = suggestions.filter((suggestion) => (
    suggestion.mapLat != null && suggestion.mapLng != null
  ));
  const mapSummaryCounts = {
    polls: activePolls.length,
    suggestions: suggestions.length,
    users: entities.usersCount,
    candidates: candidates.length,
  };
  const hasContent = entities.articles.length > 0 || entities.polls.length > 0 || suggestions.length > 0 || candidates.length > 0;
  // True when the location has or is loading child locations.
  // Controls LocationChildrenExplorer rendering and suppresses duplicate child chips in header/related.
  const hasChildren = children.length > 0 || secondaryLoading;
  const showMainLocationMap = shouldShowMainLocationMap({ location, children, secondaryLoading });

  const TAB_LABELS = {
    polls: `Ψηφοφορίες${activePolls.length ? ` (${activePolls.length})` : ''}`,
    news: `Ειδήσεις${newsArticles.length ? ` (${newsArticles.length})` : ''}`,
    articles: `Άρθρα${regularArticles.length ? ` (${regularArticles.length})` : ''}`,
    users: `Χρήστες${entities.usersCount ? ` (${entities.usersCount})` : ''}`,
    unclaimed: `Αδιεκδίκητα${entities.unclaimedCount ? ` (${entities.unclaimedCount})` : ''}`,
    candidates: `Candidates${candidates.length ? ` (${candidates.length})` : ''}`,
    suggestions: `Προτάσεις${suggestions.length ? ` (${suggestions.length})` : ''}`,
    elections: '🗳️ Εκλογές',
  };

  // Determine which tabs have content (for hiding empty tabs)
  const TAB_COUNTS = {
    polls: activePolls.length,
    news: newsArticles.length,
    articles: regularArticles.length,
    users: entities.usersCount,
    unclaimed: entities.unclaimedCount,
    candidates: candidates.length,
    suggestions: suggestions.length,
    elections: 1,
  };
  const preferredAlwaysVisibleTabs = ['polls', 'suggestions', ...ALWAYS_VISIBLE_TABS];
  const visibleTabs = secondaryLoading
    ? VALID_TABS
    : [
      ...VALID_TABS.filter(tab => !preferredAlwaysVisibleTabs.includes(tab) && TAB_COUNTS[tab] > 0),
      ...preferredAlwaysVisibleTabs,
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
  const canHaveChildHierarchy = !['municipality', 'electoral_district'].includes(location?.type);
  const showHierarchyNearTop = children.length > 0 || (secondaryLoading && canHaveChildHierarchy);
  const hasExploreSection = showHierarchyNearTop || secondaryLoading || children.length > 0 || Boolean(location.parent || siblings.length > 0);
  const hasLocalInfoSection = secondaryLoading || mergedBodySections.length > 0;
  const pageNavItems = [
    { href: '#location-content', label: 'Συμμετοχή' },
    { href: '#location-wall', label: 'Συζήτηση' },
    { href: '#location-roles', label: 'Εκπρόσωποι' },
    hasLocalInfoSection ? { href: '#location-local-info', label: 'Πληροφορίες' } : null,
    showMainLocationMap ? { href: '#location-map', label: 'Χάρτης' } : null,
    hasExploreSection ? { href: '#location-children-explorer', label: 'Περιοχή' } : null,
  ].filter(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <LocationBreadcrumb breadcrumb={breadcrumb} homeBreadcrumb={homeBreadcrumb} />

        {/* Compact Location Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {isEditing ? (
            <LocationEditForm
              location={location}
              editedData={editedData}
              isSaving={isSaving}
              onSave={handleSave}
              onCancel={handleCancelEdit}
              onInputChange={handleInputChange}
              onBoundaryValidationChange={setBoundaryValidation}
              onImageUploaded={() => {
                setImageError(false);
                refetch();
              }}
            />
          ) : (
            <LocationHeader
              location={location}
              sections={sections}
              children={children}
              hideChildren={hasChildren}
              activePolls={activePolls}
              newsArticles={newsArticles}
              regularArticles={regularArticles}
              suggestionsCount={suggestions.length}
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
          <>
            <LocationPageNav items={pageNavItems} />

            <LocationActionSummary
              counts={{
                polls: activePolls.length,
                suggestions: suggestions.length,
                news: newsArticles.length,
                articles: regularArticles.length,
                users: entities.usersCount,
              }}
              loading={secondaryLoading}
              isAuthenticated={isAuthenticated}
              onTabSelect={handleTabChange}
            />

            {showHierarchyNearTop && (
              <LocationChildrenExplorer
                location={location}
                parent={location.parent}
                siblings={siblings}
                children={children}
                loading={secondaryLoading}
              />
            )}

            {/* Map: own geometry only when the hierarchy explorer will not render a map. */}
            {showMainLocationMap && (
              <div id="location-map" className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Χάρτης</h2>
                <div className="overflow-hidden rounded-lg bg-white shadow-md lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
                  <LocationMap
                    location={location}
                    summaryCounts={mapSummaryCounts}
                    mapIssues={mapIssueSuggestions}
                    pendingIssuePin={mapIssuePin}
                    onMapClick={isAuthenticated ? handleMapIssueMapClick : undefined}
                    className="h-80 w-full lg:h-full"
                  />
                  <form
                    onSubmit={handleSubmitMapIssue}
                    className="space-y-4 border-t border-gray-200 p-4 lg:border-l lg:border-t-0"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Local issue</p>
                      <h3 className="mt-1 text-base font-semibold text-gray-900">
                        {mapIssuePin ? 'Pin selected' : 'Add a map pin'}
                      </h3>
                    </div>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Type</span>
                      <select
                        value={mapIssueForm.mapIssueType}
                        onChange={(event) => handleMapIssueTypeChange(event.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isAuthenticated || isSubmittingMapIssue}
                      >
                        {MAP_ISSUE_TYPES.map((issueType) => (
                          <option key={issueType.value} value={issueType.value}>
                            {issueType.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Title</span>
                      <input
                        type="text"
                        value={mapIssueForm.title}
                        onChange={(event) => setMapIssueForm((prev) => ({ ...prev, title: event.target.value }))}
                        placeholder="Broken pavement on main street"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isAuthenticated || isSubmittingMapIssue}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Details</span>
                      <textarea
                        value={mapIssueForm.body}
                        onChange={(event) => setMapIssueForm((prev) => ({ ...prev, body: event.target.value }))}
                        rows={4}
                        placeholder="Add what locals should know."
                        className="mt-1 block w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!isAuthenticated || isSubmittingMapIssue}
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={mapIssueForm.hideCreator}
                        onChange={(event) => setMapIssueForm((prev) => ({ ...prev, hideCreator: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={!isAuthenticated || isSubmittingMapIssue}
                      />
                      Post anonymously
                    </label>

                    {mapIssuePin && (
                      <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        {Number(mapIssuePin.lat).toFixed(5)}, {Number(mapIssuePin.lng).toFixed(5)}
                      </p>
                    )}

                    {isAuthenticated ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSubmittingMapIssue || !mapIssuePin}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          {isSubmittingMapIssue ? 'Posting...' : 'Post issue'}
                        </button>
                        {mapIssuePin && (
                          <button
                            type="button"
                            onClick={() => setMapIssuePin(null)}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                            disabled={isSubmittingMapIssue}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    ) : (
                      <LoginLink className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
                        Sign in to post
                      </LoginLink>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Tabbed content — participation-first placement */}
            <div id="location-content" className="mb-8 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Συμμετοχή και δραστηριότητα</h2>
              <LocationTabs
                activeTab={resolvedActiveTab}
                onTabChange={handleTabChange}
                activePolls={activePolls}
                newsArticles={newsArticles}
                regularArticles={regularArticles}
                entities={entities}
                suggestions={suggestions}
                candidates={candidates}
                isAuthenticated={isAuthenticated}
                locationIdentifier={location.slug || location.id}
                canManageLocations={canManageLocations()}
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
            </div>

            <div id="location-wall" className="mb-8 bg-white rounded-lg shadow-md p-6">
              <CommentsThread
                entityType="location"
                entityId={location.id}
                title="Wall"
                composerPlaceholder={`Post about ${location.name_local || location.name}...`}
                emptyMessage="No wall posts yet."
              />
            </div>

            {/* Location Roles — assigned officials for this location */}
            {location && (
              <div id="location-roles" className="mb-8 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Εκπρόσωποι και ρόλοι</h2>
                <LocationRoles
                  locationId={location.id}
                  showEmptyState
                  canManageLocations={canManageLocations()}
                  onEdit={handleEdit}
                />
              </div>
            )}

            {(secondaryLoading || mergedBodySections.length > 0) && (
              <div id="location-local-info" className="mb-8 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Τοπικές πληροφορίες</h2>
                {secondaryLoading ? (
                  <SkeletonLoader type="card" count={2} />
                ) : (
                  <LocationSections sections={mergedBodySections} />
                )}
              </div>
            )}

            {location?.type === 'country' && fundingLoaded && (
              <div className="mb-6">
                <CountryFundingBanner
                  funding={fundingData}
                  locationName={location.name_local || location.name}
                  hasContent={hasContent}
                />
              </div>
            )}

            {!showHierarchyNearTop && (
              <LocationChildrenExplorer
                location={location}
                parent={location.parent}
                siblings={siblings}
                children={children}
                loading={secondaryLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
