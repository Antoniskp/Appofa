const { encryptToken, decryptToken } = require('../src/utils/encryption');

describe('Token Encryption Tests', () => {
  test('should encrypt and decrypt a token successfully', () => {
    const originalToken = 'github_token_abc123xyz';
    
    const encrypted = encryptToken(originalToken);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(originalToken);
    
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(originalToken);
  });

  test('should handle null tokens', () => {
    expect(encryptToken(null)).toBeNull();
    expect(decryptToken(null)).toBeNull();
  });

  test('should return different encrypted values for same token', () => {
    const token = 'test_token_123';
    
    const encrypted1 = encryptToken(token);
    const encrypted2 = encryptToken(token);
    
    // Different encrypted values due to random IV and salt
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both decrypt to the same value
    expect(decryptToken(encrypted1)).toBe(token);
    expect(decryptToken(encrypted2)).toBe(token);
  });

  test('should handle invalid encrypted data gracefully', () => {
    const invalidData = 'invalid-base64-data';
    const decrypted = decryptToken(invalidData);
    expect(decrypted).toBeNull();
  });

  test('should encrypt long tokens', () => {
    const longToken = 'a'.repeat(1000);
    
    const encrypted = encryptToken(longToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(longToken);
  });

  test('should handle special characters in tokens', () => {
    const specialToken = 'token!@#$%^&*()_+-={}[]|\\:";\'<>?,./`~';
    
    const encrypted = encryptToken(specialToken);
    const decrypted = decryptToken(encrypted);
    
    expect(decrypted).toBe(specialToken);
  });
});
