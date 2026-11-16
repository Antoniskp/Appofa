import Link from 'next/link';

const CAMPAIGNS = [
  { key: 'profile_location', title: 'Complete profiles', audience: 'Registered users missing a location', description: 'Ask users to add their location and discover what is happening in their area. One-time reminder for eligible subscribed accounts.' },
  { key: 'polls_followup', title: 'Popular polls', audience: 'Registered users subscribed to general updates', description: 'Choose a popular public poll and invite users to vote, share it and return to the conversation.' },
  { key: 'parliament_followup', title: 'New parliament questions', audience: 'Registered users subscribed to general updates', description: 'Choose a recent parliament question, link to its context and invite users to share their advisory opinion.' },
  { key: 'community_followup', title: 'Locations, events & problems', audience: 'Registered users subscribed to community activity', description: 'Help users follow places, find events, report local problems and suggest improvements.' },
];

export default function NewsletterUserCampaigns() {
  return <section aria-labelledby="user-email-campaigns" className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
    <h2 id="user-email-campaigns" className="text-xl font-semibold text-gray-900">Emails for registered users</h2>
    <p className="mt-2 text-sm text-gray-700">Choose a reason to contact users. Send to one registered user or an audience. Create a draft, send it to your own inbox, then improve and approve it before delivery.</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {CAMPAIGNS.map((campaign) => <article key={campaign.key} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{campaign.description}</p>
        <p className="mb-4 mt-3 text-xs text-gray-500">Audience: {campaign.audience}</p>
        <div className="mt-auto flex flex-wrap gap-3 text-sm font-semibold text-blue-700">
          <Link href={`/admin/newsletter/campaigns/new?template=${campaign.key}_el`}>Create Greek draft →</Link>
          <Link href={`/admin/newsletter/campaigns/new?template=${campaign.key}_en`}>Create English draft →</Link>
        </div>
      </article>)}
    </div>
    <p className="mt-4 text-xs text-gray-600">Account registration and email subscriptions are separate. Campaigns respect subscription status and the selected email topic. Drafts do not send automatically.</p>
  </section>;
}
