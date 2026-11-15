import districtLocationSlugs from '@/config/map-data/electoral-district-location-slugs.json';
import parliamentaryAssignments from '@/src/data/currentParliamentaryAssignments';

const districtIdByLocationSlug = new Map(Object.entries(districtLocationSlugs));
const assignmentByProfileSlug = new Map(
  parliamentaryAssignments.map(assignment => [assignment.profileSlug, assignment])
);

// Prefer the curated parliamentary assignment when a profile's constituency is stale.
export function getProfileDistrictId(profile) {
  const rosterSlug = assignmentByProfileSlug.get(profile.slug)?.electoralDistrictSlug;
  return districtIdByLocationSlug.get(rosterSlug)
    || districtIdByLocationSlug.get(profile.constituency?.slug)
    || null;
}
