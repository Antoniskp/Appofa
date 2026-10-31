import Link from 'next/link';
import RolePersonPhoto from './RolePersonPhoto';

export default function OrganizationPeople({ roles, title }) {
  const assignedRoles = roles.filter(role => role.isCurrent && (role.personProfile || role.user));
  if (!assignedRoles.length) return null;

  return (
    <section aria-label={title} className="mb-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {assignedRoles.map(role => {
          const person = role.personProfile || role.user;
          const name = [person.firstNameNative, person.lastNameNative].filter(Boolean).join(' ')
            || [person.firstNameEn, person.lastNameEn].filter(Boolean).join(' ') || person.username;
          const href = role.personProfile ? `/persons/${person.slug}` : `/users/${person.username}`;
          return (
            <Link key={role.id} href={href} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:bg-gray-50">
              <RolePersonPhoto person={person} name={name} />
              <div className="min-w-0">
                <p className="break-words text-base font-semibold text-gray-900">{name}</p>
                <p className="mt-1 text-sm text-gray-600">{role.title}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
