// Dates are shown in Greek format and Greek time everywhere, so server-rendered
// HTML and the browser produce the same text whatever the visitor's own settings.
const TIME_ZONE = 'Europe/Athens';
const LOCALES = { el: 'el-GR', en: 'en-GB', ro: 'ro-RO' };

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(value, locale = 'el') {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString(LOCALES[locale] || LOCALES.el, { timeZone: TIME_ZONE, day: 'numeric', month: 'numeric', year: 'numeric' });
}

export function formatDateTime(value, locale = 'el') {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleString(LOCALES[locale] || LOCALES.el, {
    timeZone: TIME_ZONE, day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
