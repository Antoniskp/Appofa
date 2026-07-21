'use client';

import Card from '@/components/ui/Card';
import { getExpertiseTagLabel, resolveProfessionLabel } from '@/lib/utils/professionTaxonomy';
import TwitchEmbed from '@/components/profile/TwitchEmbed';
import { getLocationBreadcrumb, hasAnySocialLinks } from './profileDisplayUtils';

export default function PublicProfileOverview({ user, labels = {}, framed = true }) {
  const homeLocation = getLocationBreadcrumb(user?.homeLocation);
  const hasProfessions = user?.professions && user.professions.length > 0;
  const hasExpertise = user?.expertiseArea && user.expertiseArea.length > 0;
  const hasSocialLinks = hasAnySocialLinks(user?.socialLinks);
  const hasOverview = user?.bio || homeLocation || hasProfessions || hasExpertise || hasSocialLinks || user?.twitchChannel;

  const content = !hasOverview ? (
    <p className="text-sm text-gray-600">
      {labels.emptySummary || 'This profile does not have a public summary yet.'}
    </p>
  ) : (
    <div className="space-y-5">
      {user.bio && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-1">{labels.bio || 'Bio'}</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{user.bio}</p>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {homeLocation && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">{labels.homeLocation || 'Home location'}</h2>
            <p className="text-sm text-gray-600">{homeLocation}</p>
          </section>
        )}

        {hasProfessions && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">{labels.professions || 'Professional identity'}</h2>
            <div className="flex flex-wrap gap-2">
              {user.professions.map((entry, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                  {resolveProfessionLabel(entry)}
                </span>
              ))}
            </div>
          </section>
        )}

        {hasExpertise && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">{labels.expertise || 'Expertise areas'}</h2>
            <div className="flex flex-wrap gap-2">
              {user.expertiseArea.map((area) => (
                <span key={area} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {getExpertiseTagLabel(area)}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {hasSocialLinks && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">{labels.links || 'Links'}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(user.socialLinks).map(([key, url]) =>
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline capitalize"
                >
                  {key}
                </a>
              ) : null
            )}
          </div>
        </section>
      )}

      {user.twitchChannel && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {labels.liveOnTwitch || 'Live on Twitch'}{' '}
            <a
              href={`https://www.twitch.tv/${user.twitchChannel}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              twitch.tv/{user.twitchChannel}
            </a>
          </h2>
          <TwitchEmbed channel={user.twitchChannel} />
        </section>
      )}
    </div>
  );

  return framed ? <Card>{content}</Card> : content;
}
