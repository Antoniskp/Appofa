/**
 * Expertise tag IDs for user and public person profiles.
 * Derived from src/data/expertiseTags.json (taxonomy v2).
 */

import expertiseTagsData from '@/src/data/expertiseTags.json';

export const EXPERTISE_AREAS = expertiseTagsData.expertiseTags.map((t) => t.id);
