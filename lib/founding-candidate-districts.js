import districtSlugs from '@/config/map-data/electoral-district-location-slugs.json';
import metadata from '@/config/map-data/electoral-districts.metadata.json';

const slugById = new Map(Object.entries(districtSlugs).map(([slug, id]) => [id, slug]));

export const foundingCandidateDistricts = metadata.electoralDistricts
  .filter(({ id }) => id !== 'district-state' && slugById.has(id))
  .map(({ id, name }) => ({ id, name, slug: slugById.get(id) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'el'));

export function foundingCandidateRegistrationPath(district) {
  return district
    ? `/candidates/register?initiative=founding&district=${encodeURIComponent(district)}`
    : '/candidates/register?initiative=founding';
}
