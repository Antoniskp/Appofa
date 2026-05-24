export const VALID_TABS = ['polls', 'news', 'articles', 'users', 'unclaimed', 'suggestions', 'elections'];
export const ALWAYS_VISIBLE_TABS = ['elections'];
export const DEFAULT_TAB = 'polls';
export const HEADER_SECTION_TYPES = ['official_links', 'contacts', 'webcams'];

const CHILD_LOCATION_TERMINOLOGY_BY_PARENT_TYPE = {
  country: {
    label: 'Νομοί / Περιφέρειες',
    lowerPlural: 'νομοί / περιφέρειες',
    genitivePlural: 'νομών / περιφερειών',
  },
  prefecture: {
    label: 'Δήμοι',
    lowerPlural: 'δήμοι',
    genitivePlural: 'δήμων',
  },
  default: {
    label: 'Υποπεριοχές',
    lowerPlural: 'υποπεριοχές',
    genitivePlural: 'υποπεριοχών',
  },
};

export function getChildLocationTerminology(parentType) {
  return CHILD_LOCATION_TERMINOLOGY_BY_PARENT_TYPE[parentType] || CHILD_LOCATION_TERMINOLOGY_BY_PARENT_TYPE.default;
}
