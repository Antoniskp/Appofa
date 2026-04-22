/**
 * Manual mock for next-intl.
 * Placed in __mocks__/ so Jest auto-applies it for all tests without
 * needing per-file jest.mock('next-intl') calls.
 * This prevents the ESM parsing errors from next-intl v4 sub-dependencies.
 */
const messages = require('../messages/el.json');

const getMessage = (namespace, key) => {
  const namespaceMessages = namespace ? messages?.[namespace] : messages;
  if (!namespaceMessages) return key;
  return key.split('.').reduce((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return current[segment];
    }
    return undefined;
  }, namespaceMessages) ?? key;
};

const useTranslations = (namespace) => (key, _values) => getMessage(namespace, key);
const useLocale = () => 'el';
const useNow = () => new Date('2026-01-01T00:00:00Z');
const useTimeZone = () => 'Europe/Athens';
const useFormatter = () => ({ dateTime: (v) => String(v), number: (v) => String(v), list: (v) => v.join(', ') });
const getTranslations = async (_namespace) => (key) => key;
const getLocale = async () => 'el';
const getMessages = async () => ({});
const NextIntlClientProvider = ({ children }) => children;
const createTranslator = () => (key) => key;

module.exports = {
  __esModule: true,
  default: { useTranslations, useLocale, NextIntlClientProvider },
  useTranslations,
  useLocale,
  useNow,
  useTimeZone,
  useFormatter,
  getTranslations,
  getLocale,
  getMessages,
  NextIntlClientProvider,
  createTranslator,
};
