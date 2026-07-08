import crypto from 'crypto';

// Configuration constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits for GCM
const SALT_LENGTH = 16; 

/**
 * Derives a secure cryptographic key from a plain text master password using scrypt
 */
function deriveKey(masterPassword, salt) {
  // scrypt prevents brute-force hardware scaling attacks
  return crypto.scryptSync(masterPassword, salt, KEY_LENGTH, {
    N: 16384, // CPU/memory cost factor
    r: 8,     // Block size
    p: 1      // Parallelization
  });
}

/**
 * Encrypts a string payload using AES-256-GCM
 */
export function encryptVault(plainText, masterPassword) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterPassword, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');

  // Return everything required to decrypt it later. 
  // Salt, IV, and AuthTag are public parameters and completely safe to store unencrypted.
  return JSON.stringify({
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag,
    data: encrypted
  });
}

/**
 * Decrypts a vault payload using AES-256-GCM
 */
export function decryptVault(encryptedVaultRaw, masterPassword) {
  try {
    const vault = JSON.parse(encryptedVaultRaw);
    const salt = Buffer.from(vault.salt, 'hex');
    const iv = Buffer.from(vault.iv, 'hex');
    const authTag = Buffer.from(vault.authTag, 'hex');
    const key = deriveKey(masterPassword, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(vault.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error('Authentication failed. Wrong master password or corrupted data.');
  }
}

/**
 * Generates a cryptographically secure random password
 */
export function generateSecurePassword(length = 16, includeSymbols = true) {
  const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let pool = letters + numbers;
  if (includeSymbols) pool += symbols;

  let password = '';
  
  // Keep drawing secure bytes until we satisfy the length requirement
  while (password.length < length) {
    const randomByte = crypto.randomBytes(1)[0];
    // Modulo against our pool length ensures a uniform distribution distribution 
    if (randomByte < 256 - (256 % pool.length)) {
      password += pool[randomByte % pool.length];
    }
  }

  return password;
}