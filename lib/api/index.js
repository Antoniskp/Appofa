/**
 * API client — re-exports all domain-specific API modules.
 *
 * Existing imports like:
 *   import { authAPI, articleAPI } from '@/lib/api'
 * continue to work without any changes to consuming files.
 */

export { getCsrfToken, apiRequest } from './client.js';

export { authAPI } from './auth.js';
export { adminAPI } from './admin.js';
export { articleAPI } from './articles.js';
export { locationAPI, locationRequestAPI, locationSectionAPI, locationRoleAPI, locationElectionAPI } from './locations.js';
export { bookmarkAPI } from './bookmarks.js';
export { pollAPI } from './polls.js';
export { messageAPI } from './messages.js';
export { tagAPI } from './tags.js';
export { statsAPI } from './stats.js';
export { commentAPI } from './comments.js';
export { endorsementAPI } from './endorsements.js';
export { suggestionAPI } from './suggestions.js';
export { linkPreviewAPI } from './linkPreview.js';
export { personAPI } from './persons.js';
export { personRemovalRequestAPI } from './personRemovalRequests.js';
export { reportAPI } from './reports.js';
export { dreamTeamAPI } from './dreamTeamAPI.js';
export { heroSettingsAPI } from './heroSettings.js';
export { homepageSettingsAPI } from './homepageSettings.js';
export { badgeAPI } from './badges.js';
export { manifestAPI } from './manifest.js';
export { notificationAPI } from './notifications.js';
export { geoAPI } from './geo.js';
export { geoAdminAPI } from './geoAdmin.js';
export { organizationAPI } from './organizations.js';
export { officialPostsAPI } from './officialPosts.js';
export { listIpRules, addIpRule, removeIpRule, checkIpRule } from './ipRules.js';
export { listCountryRules, addCountryRule, removeCountryRule, getSettings, updateSetting } from './geoAccess.js';
