/**
 * Shared validation utility functions for controllers
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * @param {number} minLength - Minimum password length
 * @returns {{value?: string, error?: string}}
 */
const normalizePassword = (password, fieldLabel, minLength = 6) => {
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
  } catch (parseError) {
    return { error: `${fieldLabel} is malformed.` };
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { error: `${fieldLabel} must use HTTP or HTTPS protocol.` };
  }
  return { value: trimmedValue };
};

module.exports = {
  normalizeRequiredText,
  normalizeOptionalText,
  normalizeEmail,
  normalizePassword,
  normalizeBoolean,
  normalizeStringArray,
  normalizeEnum,
  normalizeUrl,
};
