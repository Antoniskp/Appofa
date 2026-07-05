/**
 * Shared validation utility functions for controllers
 */

const net = require('net');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BLOCKED_PUBLIC_URL_HOSTNAMES = new Set(['localhost', 'localhost.localdomain']);

/**
 * Normalize and validate a required text field
 * @param {*} value - The value to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @param {number} minLength - Minimum length (optional)
 * @param {number} maxLength - Maximum length (optional)
 * @returns {{value?: string, error?: string}}
 */
const normalizeRequiredText = (value, fieldLabel, minLength, maxLength) => {
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { error: `${fieldLabel} is required.` };
  }
  if (minLength != null && trimmedValue.length < minLength) {
    const rangeMsg = maxLength != null 
      ? `must be between ${minLength} and ${maxLength} characters`
      : `must be at least ${minLength} characters`;
    return { error: `${fieldLabel} ${rangeMsg}.` };
  }
  if (maxLength != null && trimmedValue.length > maxLength) {
    const rangeMsg = minLength != null
      ? `must be between ${minLength} and ${maxLength} characters`
      : `must be ${maxLength} characters or fewer`;
    return { error: `${fieldLabel} ${rangeMsg}.` };
  }
  return { value: trimmedValue };
};

/**
 * Normalize and validate an optional text field
 * @param {*} value - The value to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @param {number} minLength - Minimum length (optional)
 * @param {number} maxLength - Maximum length (optional)
 * @returns {{value?: string|null|undefined, error?: string}}
 */
const normalizeOptionalText = (value, fieldLabel, minLength, maxLength) => {
  if (value === undefined) {
    return { value: undefined };
  }
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { value: null };
  }
  if (minLength != null && trimmedValue.length < minLength) {
    return { error: `${fieldLabel} must be at least ${minLength} characters.` };
  }
  if (maxLength != null && trimmedValue.length > maxLength) {
    return { error: `${fieldLabel} must be ${maxLength} characters or fewer.` };
  }
  return { value: trimmedValue };
};

/**
 * Normalize and validate an email address
 * @param {*} email - The email to validate
 * @returns {{value?: string, error?: string}}
 */
const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return { error: 'Email must be a string.' };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) {
    return { error: 'Email is required.' };
  }
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return { error: 'Email must be a valid email address.' };
  }
  return { value: trimmedEmail };
};

/**
 * Normalize and validate a password
 * @param {*} password - The password to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @param {number} minLength - Minimum password length (required)
 * @returns {{value?: string, error?: string}}
 */
const normalizePassword = (password, fieldLabel, minLength) => {
  if (typeof password !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  if (!password) {
    return { error: `${fieldLabel} is required.` };
  }
  if (password.length < minLength) {
    return { error: `${fieldLabel} must be at least ${minLength} characters.` };
  }
  return { value: password };
};

/**
 * Normalize and validate a boolean field
 * @param {*} value - The value to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @returns {{value?: boolean|undefined, error?: string}}
 */
const normalizeBoolean = (value, fieldLabel) => {
  if (value === undefined) {
    return { value: undefined };
  }
  if (typeof value !== 'boolean') {
    return { error: `${fieldLabel} must be a boolean.` };
  }
  return { value };
};

/**
 * Normalize and validate an array of strings (e.g., tags)
 * @param {*} values - The array to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @returns {{value?: string[]|undefined, error?: string}}
 */
const normalizeStringArray = (values, fieldLabel = 'Field') => {
  if (values === undefined) {
    return { value: undefined };
  }
  if (values === null) {
    return { value: [] };
  }
  if (!Array.isArray(values)) {
    return { error: `${fieldLabel} must be an array of strings.` };
  }
  const normalized = [];
  for (const item of values) {
    if (typeof item !== 'string') {
      return { error: `${fieldLabel} must be an array of strings.` };
    }
    const trimmed = item.trim();
    if (trimmed) {
      normalized.push(trimmed);
    }
  }
  return { value: normalized };
};

/**
 * Normalize and validate a value against a set of allowed values
 * @param {*} value - The value to validate
 * @param {string[]} allowedValues - Array of allowed values
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @returns {{value?: string|undefined, error?: string}}
 */
const normalizeEnum = (value, allowedValues, fieldLabel) => {
  if (value === undefined) {
    return { value: undefined };
  }
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  const trimmedValue = value.trim();
  if (!allowedValues.includes(trimmedValue)) {
    return { error: `${fieldLabel} must be one of: ${allowedValues.join(', ')}.` };
  }
  return { value: trimmedValue };
};

/**
 * Normalize and validate a URL
 * @param {*} value - The URL to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @param {boolean} allowRelative - Whether to allow relative URLs (starting with /)
 * @returns {{value?: string|null|undefined, error?: string}}
 */
const normalizeUrl = (value, fieldLabel = 'URL', allowRelative = true) => {
  if (value === undefined) {
    return { value: undefined };
  }
  if (value === null) {
    return { value: null };
  }
  if (typeof value !== 'string') {
    return { error: `${fieldLabel} must be a string.` };
  }
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return { value: null };
  }
  
  // Allow relative URLs
  if (allowRelative && trimmedValue.startsWith('/')) {
    return { value: trimmedValue };
  }
  
  // Validate absolute URLs
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    return { error: `${fieldLabel} is malformed.` };
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { error: `${fieldLabel} must use HTTP or HTTPS protocol.` };
  }
  return { value: trimmedValue };
};

const isPrivateIPv4 = (hostname) => {
  const parts = hostname.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    a === 0
  );
};

const isPrivateIPv6 = (hostname) => {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
};

const isBlockedPublicUrlHost = (hostname) => {
  const normalized = hostname.replace(/\.$/, '').toLowerCase();
  if (!normalized || BLOCKED_PUBLIC_URL_HOSTNAMES.has(normalized) || normalized.endsWith('.localhost')) {
    return true;
  }
  const ipHost = normalized.replace(/^\[|\]$/g, '');
  if (net.isIP(ipHost) === 4) return isPrivateIPv4(ipHost);
  if (net.isIP(ipHost) === 6) return isPrivateIPv6(ipHost);
  return false;
};

/**
 * Normalize and validate a public HTTP(S) URL.
 * Use this for user-provided media URLs that may be fetched by clients or image optimizers.
 */
const normalizePublicHttpUrl = (value, fieldLabel = 'URL', allowRelative = true) => {
  const result = normalizeUrl(value, fieldLabel, allowRelative);
  if (result.error || result.value == null || result.value === undefined || result.value.startsWith('/')) {
    return result;
  }

  const parsedUrl = new URL(result.value);
  if (parsedUrl.username || parsedUrl.password) {
    return { error: `${fieldLabel} must not include credentials.` };
  }
  if (isBlockedPublicUrlHost(parsedUrl.hostname)) {
    return { error: `${fieldLabel} must use a public hostname.` };
  }
  return result;
};

/**
 * Normalize and validate an integer
 * @param {*} value - The value to validate
 * @param {string} fieldLabel - Human-readable field name for error messages
 * @param {number} minValue - Minimum allowed value (optional)
 * @param {number} maxValue - Maximum allowed value (optional)
 * @returns {{value?: number, error?: string}}
 */
const normalizeInteger = (value, fieldLabel, minValue, maxValue) => {
  if (value === undefined || value === null) {
    return { error: `${fieldLabel} is required.` };
  }
  
  const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
  
  if (!Number.isInteger(numValue)) {
    return { error: `${fieldLabel} must be an integer.` };
  }
  
  if (minValue != null && numValue < minValue) {
    return { error: `${fieldLabel} must be at least ${minValue}.` };
  }
  
  if (maxValue != null && numValue > maxValue) {
    return { error: `${fieldLabel} must be at most ${maxValue}.` };
  }
  
  return { value: numValue };
};

/**
 * Escape special characters in SQL LIKE patterns.
 * @param {*} value - The raw search text
 * @returns {string}
 */
const escapeLikePattern = (value) => String(value).replace(/[\\%_]/g, '\\$&');

module.exports = {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeEmail,
  normalizePassword,
  normalizeBoolean,
  normalizeStringArray,
  normalizeEnum,
  normalizeUrl,
  normalizePublicHttpUrl,
  normalizeInteger,
  escapeLikePattern,
};
