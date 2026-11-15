const COPY = {
  en: {
    profile: ['Make Appofasi local to you', 'Add your location and help shape your community.', 'Your community starts with you', 'Add your location so you can find the issues, polls and events that matter to your area.', 'Complete your profile', '{{onboardingUrl}}'],
    polls: ['What do you think? Join the conversation on Appofasi', 'Take part in a poll and share it with your community.', 'Your opinion can start a conversation', 'Explore the latest polls, add your voice and share a question with friends who care about it.', 'Explore the polls', '{{siteUrl}}/polls'],
    community: ['Stay close to what is happening in your area', 'Follow places, discover events and report local problems.', 'Small actions can improve your community', 'Follow the places you care about, discover upcoming events and bring local problems to the attention of your community.', 'Find your locations', '{{siteUrl}}/locations'],
    actions: ['More ways to take part', 'Vote on issues that matter to you', 'Follow your locations', 'Discover community events', 'Report a problem or suggest an improvement'],
    closing: 'Choose the email topics you want in your profile settings. Each poll has its own participation rules. The Appofasi team',
    featured: 'A poll to discuss', vote: 'View the poll and take part',
  },
  el: {
    profile: ['Το Appofasi στην περιοχή σου — πρόσθεσε την τοποθεσία σου', 'Βρες τοπικά ζητήματα, ψηφοφορίες και εκδηλώσεις.', 'Η κοινότητά σου ξεκινά από εσένα', 'Πρόσθεσε την τοποθεσία σου για να βρίσκεις τα ζητήματα, τις ψηφοφορίες και τις εκδηλώσεις που αφορούν την περιοχή σου.', 'Συμπλήρωσε το προφίλ σου', '{{onboardingUrl}}'],
    polls: ['Ποια είναι η γνώμη σου; Πάρε μέρος στο Appofasi', 'Ψήφισε και μοιράσου μια ψηφοφορία με την κοινότητά σου.', 'Η γνώμη σου μπορεί να ανοίξει μια συζήτηση', 'Δες τις τελευταίες ψηφοφορίες, πες τη γνώμη σου και μοιράσου ένα ερώτημα με φίλους που ενδιαφέρονται.', 'Δες τις ψηφοφορίες', '{{siteUrl}}/polls'],
    community: ['Μάθε τι συμβαίνει στην περιοχή σου', 'Ακολούθησε τοποθεσίες, βρες εκδηλώσεις και ανάφερε προβλήματα.', 'Μικρές πράξεις μπορούν να βελτιώσουν την κοινότητά σου', 'Ακολούθησε τις τοποθεσίες που σε ενδιαφέρουν, ανακάλυψε προσεχείς εκδηλώσεις και ανάδειξε τοπικά προβλήματα στην κοινότητά σου.', 'Βρες τις τοποθεσίες σου', '{{siteUrl}}/locations'],
    actions: ['Περισσότεροι τρόποι συμμετοχής', 'Ψήφισε για όσα σε ενδιαφέρουν', 'Ακολούθησε τις τοποθεσίες σου', 'Βρες εκδηλώσεις της κοινότητας', 'Ανάφερε ένα πρόβλημα ή πρότεινε μια βελτίωση'],
    closing: 'Επίλεξε τα θέματα των email που θέλεις στις ρυθμίσεις του προφίλ σου. Κάθε ψηφοφορία έχει τους δικούς της κανόνες συμμετοχής. Η ομάδα του Appofasi',
    featured: 'Μια ψηφοφορία για συζήτηση', vote: 'Δες την ψηφοφορία και πάρε μέρος',
  },
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function followupTemplate(kind, locale) {
  const copy = COPY[locale];
  const [subject, previewText, title, intro, cta, url] = copy[kind];
  const paths = ['/polls', '/locations', '/calendar', '/suggestions/new'];
  const links = paths.map((path, index) => ({ url: `{{siteUrl}}${path}`, label: copy.actions[index + 1] }));
  const labels = { profile: 'Complete your profile & get involved', polls: 'Poll participation follow-up', community: 'Locations, events & problem reporting' };
  return {
    key: kind === 'profile' ? `profile_location_${locale}` : `${kind}_followup_${locale}`,
    label: `${labels[kind]} (${locale === 'el' ? 'Greek' : 'English'})`,
    subject, previewText,
    htmlContent: `<h2 style="font-size:26px;line-height:1.25;">${title}</h2><p style="font-size:16px;line-height:1.7;">${intro}</p><p style="margin:28px 0;"><a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">${cta}</a></p><h3>${copy.actions[0]}</h3><ul style="padding-left:20px;line-height:2;">${links.map((link) => `<li><a href="${link.url}">${link.label}</a></li>`).join('')}</ul><p style="font-size:13px;line-height:1.6;color:#64748b;">${copy.closing}</p>`,
    textContent: `${title}\n\n${intro}\n\n${cta}: ${url}\n\n${copy.actions[0]}\n${links.map((link) => `${link.label}: ${link.url}`).join('\n')}\n\n${copy.closing}`,
    audienceFilters: { purpose: kind === 'profile' ? 'profile_location' : 'newsletter', segment: kind === 'profile' ? 'missing_location' : 'registered', topic: kind === 'community' ? 'activity' : 'general', locale, status: 'subscribed' },
  };
}

export const FOLLOWUP_TEMPLATES = ['profile', 'polls', 'community'].flatMap((kind) => ['el', 'en'].map((locale) => followupTemplate(kind, locale)));

export function buildFeaturedPollBlock(poll, locale = 'el') {
  if (!Number.isSafeInteger(Number(poll.id)) || Number(poll.id) <= 0 || poll.visibility !== 'public' || poll.status !== 'active' || poll.voteRestriction === 'locals_only' || (poll.deadline && new Date(poll.deadline) <= new Date())) {
    throw new Error('Choose an active public poll without a local voting restriction.');
  }
  const copy = COPY[locale] || COPY.el;
  const url = `{{siteUrl}}/polls/${Number(poll.id)}`;
  return {
    html: `<!-- featured-poll --><div style="margin:28px 0;padding:24px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;"><p style="font-size:12px;font-weight:bold;color:#2563eb;">${copy.featured}</p><h3 style="font-size:21px;line-height:1.4;">${escapeHtml(poll.title)}</h3><p><a href="${url}" style="font-weight:bold;color:#1d4ed8;">${copy.vote} →</a></p></div><!-- /featured-poll -->`,
    text: `${copy.featured}\n${poll.title}\n${copy.vote}: ${url}`,
  };
}
