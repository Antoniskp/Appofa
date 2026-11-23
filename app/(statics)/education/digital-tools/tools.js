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
    id: 'cargr', name: 'car.gr', category: 'vehicles', countries: ['GR'], model: 'listingFees',
    domain: 'car.gr', url: 'https://www.car.gr/', logo: 'cargr.ico', tint: '#eef1fc',
    sources: [
      ['privateListing', 'https://www.car.gr/classifieds/cars/new/15001?lang=el'],
      ['listingPromotion', 'https://www.car.gr/landing/promotions/'],
      ['dealers', 'https://www.car.gr/help-center/emporoi/'],
    ],
  },
  {
    id: 'spitogatos', name: 'Spitogatos', category: 'property', countries: ['GR'], model: 'listingFees',
    domain: 'spitogatos.gr', url: 'https://www.spitogatos.gr/', logo: 'spitogatos.ico', tint: '#fff3e4',
    sources: [
      ['listingGuide', 'https://www.spitogatos.gr/blog/kataxorisi-aggelias-pos-tha-anebaseis-to-akinito-sou-sto-spitogatos'],
      ['priceGuide', 'https://spitocraft.gr/odigos/aggelia-ston-spitogato'],
    ],
  },
  {
    id: 'spiti24', name: 'Spiti24', category: 'property', countries: ['GR'], model: 'listingFees',
    domain: 'spiti24.gr', url: 'https://www.spiti24.gr/', logo: 'spiti24.ico', tint: '#edf3fa',
    sources: [['propertyNetwork', 'https://gr.linkedin.com/company/spitogatos.gr'], ['networkListings', 'https://stoubanou.gr/ypiresies-diafimisis']],
  },
  {
    id: 'autovit', name: 'Autovit.ro', category: 'vehicles', countries: ['RO'], model: 'listingFees',
    domain: 'autovit.ro', url: 'https://www.autovit.ro/', logo: 'autovit.png', tint: '#edf2fb',
    sources: [
      ['sellerGuide', 'https://www.ajutor.autovit.ro/vinde?from=postAdButton'],
      ['dealerPricing', 'https://ajutor.autovit.ro/autovithelp/s/article/Liste-Pre%C8%9Buri-Publicare'],
      ['listingPromotion', 'https://ajutor.autovit.ro/autovithelp/s/article/Liste-Pre%C8%9Buri-Promovare'],
    ],
  },
  {
    id: 'imobiliare', name: 'Imobiliare.ro', category: 'property', countries: ['RO'], model: 'listingFees',
    domain: 'imobiliare.ro', url: 'https://www.imobiliare.ro/', logo: 'imobiliare.png', tint: '#eaf5fa',
    sources: [
      ['aboutPlatform', 'https://www.imobiliare.ro/despre-noi'],
      ['listingPackages', 'https://www.imobiliare.ro/imoexpert/question/cat-costa-sa-public-un-anunt/'],
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
    id: 'meteo', name: 'meteo.gr', category: 'weather', countries: ['GR'], model: 'research',
    domain: 'meteo.gr', url: 'https://www.meteo.gr/', logo: 'meteo.ico', tint: '#eaf2fc',
    sources: [
      ['weatherService', 'https://w2.meteo.gr/about-meteo.cfm'],
      ['researchNetwork', 'https://www.noa.gr/en/research/main-infrastructure/meteorological-network/'],
      ['advertising', 'https://www.meteo.gr/gdpr-meteo.cfm'],
    ],
  },
  {
    id: 'meteoromania', name: 'Meteo România', category: 'weather', countries: ['RO'], model: 'publicService',
    domain: 'meteoromania.ro', url: 'https://www.meteoromania.ro/', logo: 'meteoromania.ico', tint: '#edf3fb',
    sources: [
      ['weatherProducts', 'https://www.meteoromania.ro/produse-si-servicii/'],
      ['financialReports', 'https://www.meteoromania.ro/wp-content/uploads/RaportAdministratori/raport-administratori-2024.pdf'],
    ],
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
    marketPricing: {
      plan: 'Google AI Pro',
      GR: { amount: 22.99, currency: 'EUR', url: 'https://gemini.google/gr/subscriptions/' },
      RO: { amount: 109.99, currency: 'RON', url: 'https://gemini.google/ro/subscriptions/' },
    },
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
