import {
  AdjustmentsHorizontalIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FlagIcon,
  GlobeEuropeAfricaIcon,
  HeartIcon,
  HomeIcon,
  IdentificationIcon,
  MapPinIcon,
  PhotoIcon,
  ShieldExclamationIcon,
  StarIcon,
  UserGroupIcon,
  UserMinusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const ADMIN_ROLES = ['admin'];
const STAFF_ROLES = ['admin', 'moderator'];

export const adminNavSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: HomeIcon, roles: STAFF_ROLES },
    ],
  },
  {
    label: 'Queues',
    items: [
      { href: '/admin/reports', label: 'Reports', icon: FlagIcon, roles: STAFF_ROLES, translationKey: 'reports' },
      { href: '/admin/messages', label: 'Messages', icon: EnvelopeIcon, roles: STAFF_ROLES, translationKey: 'manage_messages' },
      { href: '/admin/persons/claims', label: 'Person Claims', icon: IdentificationIcon, roles: STAFF_ROLES },
      { href: '/admin/removal-requests', label: 'Removal Requests', icon: UserMinusIcon, roles: STAFF_ROLES },
    ],
  },
  {
    label: 'People & Orgs',
    items: [
      { href: '/admin/users', label: 'Users', icon: UsersIcon, roles: STAFF_ROLES, translationKey: 'manage_users' },
      { href: '/admin/persons', label: 'Persons', icon: UserGroupIcon, roles: STAFF_ROLES, translationKey: 'manage_persons' },
      { href: '/admin/organizations', label: 'Organizations', icon: BuildingOfficeIcon, roles: STAFF_ROLES },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/homepage', label: 'Homepage', icon: AdjustmentsHorizontalIcon, roles: ADMIN_ROLES },
      { href: '/admin/hero', label: 'Hero Settings', icon: PhotoIcon, roles: ADMIN_ROLES, translationKey: 'hero_settings' },
      { href: '/admin/articles', label: 'Articles', icon: DocumentTextIcon, roles: STAFF_ROLES, translationKey: 'all_articles' },
      { href: '/admin/manifests', label: 'Manifests', icon: DocumentTextIcon, roles: STAFF_ROLES, translationKey: 'manage_manifests' },
      { href: '/admin/dream-team', label: 'Dream Team', icon: StarIcon, roles: STAFF_ROLES, translationKey: 'dream_team' },
      { href: '/admin/newsletter', label: 'Newsletter', icon: EnvelopeIcon, roles: STAFF_ROLES },
    ],
  },
  {
    label: 'Locations',
    items: [
      { href: '/admin/locations', label: 'Locations', icon: MapPinIcon, roles: STAFF_ROLES, translationKey: 'manage_locations' },
      { href: '/admin/geo', label: 'Geo & Countries', icon: GlobeEuropeAfricaIcon, roles: ADMIN_ROLES, translationKey: 'geo_countries', descriptionKey: 'geo_countries_description' },
      { href: '/admin/ip-rules', label: 'IP Rules', icon: ShieldExclamationIcon, roles: ADMIN_ROLES },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/status', label: 'System Health', icon: HeartIcon, roles: ADMIN_ROLES, translationKey: 'system_health' },
      { href: '/admin/worker-status', label: 'Worker Status', icon: HeartIcon, roles: ADMIN_ROLES },
    ],
  },
];

export function canAccessAdminNavItem(item, role) {
  return item.roles.includes(role);
}

export function getVisibleAdminNavSections(role) {
  return adminNavSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessAdminNavItem(item, role)),
    }))
    .filter((section) => section.items.length > 0);
}

export function getVisibleAdminNavItems(role) {
  return getVisibleAdminNavSections(role).flatMap((section) => section.items);
}
