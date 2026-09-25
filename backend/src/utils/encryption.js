const crypto = require('crypto');

// 32-byte key for AES-256
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || 'repolens-ai-default-32-byte-secret-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt sensitive string (e.g. GitHub access token)
 * @param {string} text - Plain text
 * @returns {string} - Encrypted string in format iv:authTag:ciphertext
 */
function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt sensitive string
 * @param {string} encryptedString - Format iv:authTag:ciphertext
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encryptedString) {
  if (!encryptedString) return '';
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      // In case unencrypted or legacy
      return encryptedString;
    }
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return '';
  }
}

module.exports = {
  encrypt,
  decrypt,
};
