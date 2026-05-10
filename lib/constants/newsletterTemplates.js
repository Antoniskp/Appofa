export const NEWSLETTER_TEMPLATES = [
  {
    key: 'announcement',
    label: 'Announcement',
    subject: '📢 Appofa Announcement',
    previewText: 'A quick update from the Appofa team.',
    htmlContent: '<h2>Announcement</h2><p>Share your key announcement details here.</p><p><strong>What changes:</strong></p><ul><li>Item 1</li><li>Item 2</li></ul>',
    textContent: 'Announcement\n\nShare your key announcement details here.\n\nWhat changes:\n- Item 1\n- Item 2',
  },
  {
    key: 'news_roundup',
    label: 'News Roundup',
    subject: '📰 Weekly Civic Roundup',
    previewText: 'Top civic highlights and updates from this week.',
    htmlContent: '<h2>This week at Appofa</h2><p>Here are the top highlights:</p><ol><li>Highlight #1</li><li>Highlight #2</li><li>Highlight #3</li></ol>',
    textContent: 'This week at Appofa\n\nHere are the top highlights:\n1) Highlight #1\n2) Highlight #2\n3) Highlight #3',
  },
  {
    key: 'platform_update',
    label: 'Platform Update',
    subject: '⚙️ Platform Update',
    previewText: 'New Appofa features and improvements.',
    htmlContent: '<h2>Platform update</h2><p>We shipped new improvements:</p><ul><li>Feature A</li><li>Feature B</li></ul><p>Thank you for helping shape the platform.</p>',
    textContent: 'Platform update\n\nWe shipped new improvements:\n- Feature A\n- Feature B\n\nThank you for helping shape the platform.',
  },
  {
    key: 'event_promo',
    label: 'Event / Promo',
    subject: '📅 Upcoming Event',
    previewText: 'Join us at our next community event.',
    htmlContent: '<h2>You are invited</h2><p><strong>Event:</strong> [Event Name]</p><p><strong>Date:</strong> [Date]</p><p><strong>Location:</strong> [Location]</p><p>See you there!</p>',
    textContent: 'You are invited\n\nEvent: [Event Name]\nDate: [Date]\nLocation: [Location]\n\nSee you there!',
  },
];
