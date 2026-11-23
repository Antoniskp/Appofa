export const directoryPath = '/education/digital-tools';
export const reviewedOn = '2026-11-23';

export const tools = [
  {
    id: 'airbnb', name: 'Airbnb', category: 'travel', model: 'commission',
    domain: 'airbnb.com', url: 'https://www.airbnb.com/', logo: 'airbnb.png', tint: '#fff0f2',
    sources: [['fees', 'https://www.airbnb.com/help/article/1857']],
  },
  {
    id: 'booking', name: 'Booking.com', category: 'travel', model: 'commission',
    domain: 'booking.com', url: 'https://www.booking.com/', logo: 'booking.ico', tint: '#e9effb',
    sources: [
      ['partnerTerms', 'https://admin.booking.com/hotelreg/terms-and-conditions.html?cc1=us&lang=en'],
      ['earnings', 'https://www.bookingholdings.com/wp-content/uploads/2026/11/Q3-26-BKNG-Earnings-Release-Final.pdf'],
    ],
  },
  {
    id: 'inkscape', name: 'Inkscape', category: 'creative', model: 'openSource',
    domain: 'inkscape.org', url: 'https://inkscape.org/', logo: 'inkscape.png', tint: '#eef0ef',
    sources: [['project', 'https://sfconservancy.org/projects/current/#inkscape']],
  },
  {
    id: 'gimp', name: 'GIMP', category: 'creative', model: 'openSource',
    domain: 'gimp.org', url: 'https://www.gimp.org/', logo: 'gimp.png', tint: '#f3ede6',
    sources: [['downloads', 'https://www.gimp.org/downloads/'], ['funding', 'https://www.gimp.org/donating/']],
  },
  {
    id: 'windy', name: 'Windy.com', category: 'weather', model: 'freemium',
    domain: 'windy.com', url: 'https://www.windy.com/', logo: 'windy.ico', tint: '#fff0f0',
    sources: [['premium', 'https://www.windy.com/subscription'], ['appStore', 'https://apps.apple.com/us/app/windy-com-weather-radar/id1161387262']],
  },
  {
    id: 'wikipedia', name: 'Wikipedia', category: 'knowledge', model: 'nonprofit',
    domain: 'wikipedia.org', url: 'https://www.wikipedia.org/', logo: 'wikipedia.ico', tint: '#edf0f5',
    sources: [['funding', 'https://wikimediafoundation.org/who-we-are/'], ['financialReports', 'https://wikimediafoundation.org/who-we-are/financial-reports/']],
  },
  {
    id: 'chatgpt', name: 'ChatGPT', category: 'ai', model: 'freemium',
    domain: 'chatgpt.com', url: 'https://chatgpt.com/', logo: 'chatgpt.png', tint: '#e8f2ed',
    sources: [['pricing', 'https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus'], ['apiPricing', 'https://openai.com/api/pricing/']],
  },
  {
    id: 'claude', name: 'Claude', category: 'ai', model: 'freemium',
    domain: 'claude.ai', url: 'https://claude.ai/', logo: 'claude.png', tint: '#faf0e7',
    sources: [['pricing', 'https://claude.com/pricing']],
  },
  {
    id: 'gemini', name: 'Google Gemini', category: 'ai', model: 'freemium',
    domain: 'gemini.google.com', url: 'https://gemini.google.com/', logo: 'gemini.png', tint: '#edf1fe',
    sources: [['pricing', 'https://one.google.com/intl/en_us/about/google-ai-plans/']],
  },
  {
    id: 'copilot', name: 'Microsoft Copilot', category: 'ai', model: 'freemium',
    domain: 'copilot.microsoft.com', url: 'https://copilot.microsoft.com/', logo: 'copilot.ico', tint: '#f0edfc',
    sources: [['pricing', 'https://www.microsoft.com/en-us/copilot/pricing/individuals']],
  },
  {
    id: 'perplexity', name: 'Perplexity', category: 'ai', model: 'freemium',
    domain: 'perplexity.ai', url: 'https://www.perplexity.ai/', logo: 'perplexity.png', tint: '#e9f4f2',
    sources: [['pricing', 'https://www.perplexity.ai/hub'], ['planDetails', 'https://www.perplexity.ai/help-center/en/articles/11187416-which-perplexity-subscription-plan-is-right-for-you']],
  },
];
