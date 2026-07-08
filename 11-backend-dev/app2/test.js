import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import { encryptVault, decryptVault } from './src/crypto-utils.js';

// Setup a separate sandbox path for integration tests
const TEST_VAULT_FILE = './vault.test.json';

// Clean up helper to run after tests finish
const cleanupTestFile = () => {
  if (fs.existsSync(TEST_VAULT_FILE)) {
    fs.unlinkSync(TEST_VAULT_FILE);
  }
};

// ==========================================
// 1. UNIT TESTS: Cryptography Engine
// ==========================================

test('Crypto Engine - Should successfully encrypt and decrypt a payload', () => {
  const secretPayload = JSON.stringify({ github: { username: 'dev123', password: 'supersecretpassword' } });
  const masterPassword = 'MySecureMasterPassword123!';

  // Encrypt the raw data
  const encryptedRaw = encryptVault(secretPayload, masterPassword);
  
  assert.ok(encryptedRaw, 'Encrypted output should not be empty');
  
  const parsedVault = JSON.parse(encryptedRaw);
  assert.ok(parsedVault.salt, 'Encrypted payload must contain a salt');
  assert.ok(parsedVault.iv, 'Encrypted payload must contain an initialization vector (iv)');
  assert.ok(parsedVault.authTag, 'Encrypted payload must contain an authentication tag');
  assert.notStrictEqual(parsedVault.data, secretPayload, 'Ciphertext must not match plaintext');

  // Decrypt the raw data back
  const decryptedPayload = decryptVault(encryptedRaw, masterPassword);
  
  assert.deepStrictEqual(
    decryptedPayload, 
    JSON.parse(secretPayload), 
    'Decrypted object should perfectly match original object structure'
  );
});

test('Crypto Engine - Should fail decryption with an incorrect master password', () => {
  const secretPayload = JSON.stringify({ banking: { password: 'money' } });
  const correctMaster = 'RightPassword123';
  const wrongMaster = 'WrongPassword123';

  const encryptedRaw = encryptVault(secretPayload, correctMaster);

  // Assert that it throws an authentication error
  assert.throws(
    () => {
      decryptVault(encryptedRaw, wrongMaster);
    },
    /Authentication failed/,
    'Should throw an error containing "Authentication failed" text'
  );
});

test('Crypto Engine - Should fail if the vault payload is tampered with (GCM Validation)', () => {
  const secretPayload = JSON.stringify({ Netflix: { password: 'chill' } });
  const masterPassword = 'SafePassword';

  const encryptedRaw = encryptVault(secretPayload, masterPassword);
  const vaultObj = JSON.parse(encryptedRaw);

  // Tamper manually with the ciphertext data bytes
  vaultObj.data = vaultObj.data.replace(/.$/, 'a'); // Swap out the last hex character
  const tamperedRaw = JSON.stringify(vaultObj);

  // AES-256-GCM should flag this manipulation via the authTag mismatch
  assert.throws(
    () => {
      decryptVault(tamperedRaw, masterPassword);
    },
    Error,
    'Altering the ciphertext data directly must trigger a decryption error'
  );
});


// ==========================================
// 2. INTEGRATION TESTS: Vault File Lifecycle
// ==========================================

test('Vault Lifecycle - Read and Write integration lifecycle loop', async (t) => {
  // Ensure a clean slate before execution
  cleanupTestFile();

  const masterPassword = 'MasterSystemPassword';
  const mockServiceData = {
    google: { username: 'test@gmail.com', password: 'googlePassword', updatedAt: new Date().toISOString() }
  };

  // Simulate adding a entry to a brand new vault file
  await t.test('Writes a new encrypted vault file to disk successfully', () => {
    const encryptedRaw = encryptVault(JSON.stringify(mockServiceData), masterPassword);
    fs.writeFileSync(TEST_VAULT_FILE, encryptedRaw, 'utf8');

    assert.ok(fs.existsSync(TEST_VAULT_FILE), 'The vault file should now exist on the disk array');
  });

  // Simulate reading that entry back on a future invocation
  await t.test('Reads and decrypts the saved file from disk accurately', () => {
    const rawFileContents = fs.readFileSync(TEST_VAULT_FILE, 'utf8');
    const decryptedVault = decryptVault(rawFileContents, masterPassword);

    assert.ok(decryptedVault.google, 'The "google" key payload should exist inside the read file');
    assert.strictEqual(decryptedVault.google.username, 'test@gmail.com');
  });

  // Teardown the file system side effect
  cleanupTestFile();
});