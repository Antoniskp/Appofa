'use client';

export function getLocationBreadcrumb(location) {
  if (!location) return null;
  const parts = [];
  let current = location;
  while (current) {
    if (current.name) parts.unshift(current.name);
    current = current.parent;
  }
  return parts.join(' -> ');
}

export function getProfileDisplayName(user) {
  const nativeName = `${user?.firstNameNative || ''} ${user?.lastNameNative || ''}`.trim();
  const englishName = `${user?.firstNameEn || ''} ${user?.lastNameEn || ''}`.trim();
  return nativeName || englishName || user?.nickname || user?.username || '';
}

export function getMemberSinceLabel(createdAt, locale) {
  if (!createdAt) return null;
  return new Date(createdAt).toLocaleDateString(locale || undefined, {
    year: 'numeric',
    month: 'short',
  });
}

export function hasAnySocialLinks(socialLinks) {
  return Boolean(socialLinks && Object.values(socialLinks).some(Boolean));
}
