const NEWS_IMAGE = '/images/branding/news default.png';
const ANALYSIS_IMAGE = '/images/branding/analysis-default.webp';

export function defaultArticleImage(article) {
  return article?.type === 'analysis' ? ANALYSIS_IMAGE : NEWS_IMAGE;
}

export function articleBannerImage(article) {
  const banner = article?.bannerImageUrl;
  // Older articles have the news placeholder persisted as their banner.
  const isNewsPlaceholder = banner === NEWS_IMAGE || banner === NEWS_IMAGE.replace(' ', '%20');
  return !banner || isNewsPlaceholder ? defaultArticleImage(article) : banner;
}
