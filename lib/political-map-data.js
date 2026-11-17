import { personAPI } from '@/lib/api/persons';

export async function loadParliamentarians() {
  const profiles = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page += 1) {
    const response = await personAPI.getAll({ position: 'parliamentary', page, limit: 100 });
    if (!response?.success || !Array.isArray(response.data?.profiles)) throw new Error('Parliamentarians unavailable');
    profiles.push(...response.data.profiles);
    totalPages = Number(response.data.pagination?.totalPages) || 1;
  }
  return [...new Map(profiles.map(profile => [profile.id, profile])).values()];
}

export async function loadPoliticalCandidates(signal) {
  const registrations = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page += 1) {
    const response = await fetch(`/api/electoral-districts/candidates?page=${page}&limit=100`, { signal });
    if (!response.ok) throw new Error('Candidates unavailable');
    const body = await response.json();
    if (!body.success || !Array.isArray(body.data?.registrations)) throw new Error('Candidates unavailable');
    registrations.push(...body.data.registrations);
    totalPages = Number(body.data.pagination?.totalPages) || 1;
  }
  return [...new Map(registrations.map(item => [item.id, item])).values()];
}

export function politicalPersonName(person) {
  return [person?.firstNameNative, person?.lastNameNative].filter(Boolean).join(' ')
    || [person?.firstNameEn, person?.lastNameEn].filter(Boolean).join(' ')
    || person?.nickname || person?.username || person?.slug || '';
}
