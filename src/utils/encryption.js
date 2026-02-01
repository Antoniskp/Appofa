const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive encryption key from secret
 */
function deriveKey(secret, salt) {
  return crypto.pbkdf2Sync(secret, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a token
 */
function encryptToken(token) {
  if (!token) return null;
  
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + encrypted + tag
  const result = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex'), tag]);
  
  return result.toString('base64');
}

/**
 * Decrypt a token
 */
function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;
  
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    const buffer = Buffer.from(encryptedToken, 'base64');
    
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH, buffer.length - TAG_LENGTH);
    const tag = buffer.subarray(buffer.length - TAG_LENGTH);
    
    const key = deriveKey(secret, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
}

module.exports = {
  encryptToken,
  decryptToken
};
