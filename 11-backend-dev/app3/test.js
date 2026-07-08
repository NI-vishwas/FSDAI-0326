import test from 'node:test';
import assert from 'node:assert';
import { encryptVault, decryptVault } from './src/crypto-utils.js';
import { 
  initDatabase, 
  saveCredential, 
  getCredential, 
  listAllServices, 
  useMemoryDatabaseForTesting 
} from './src/db-util.js';

// ==========================================
// 1. UNIT TESTS: Cryptography Engine
// ==========================================

test('Crypto Engine - Should accurately encrypt and decrypt strings', () => {
  // Test with a raw string token—exactly what our database app passes now
  const secretPassword = 'MySecretAppPassword!99';
  const masterPassword = 'MasterSecurePassword';

  // Encrypt
  const encryptedPayload = encryptVault(secretPassword, masterPassword);
  assert.ok(encryptedPayload, 'Encrypted output payload should not be empty');

  const parsedVault = JSON.parse(encryptedPayload);
  assert.ok(parsedVault.salt && parsedVault.iv && parsedVault.authTag, 'Payload structural keys must exist');
  assert.notStrictEqual(parsedVault.data, secretPassword, 'Ciphertext block should mask plaintext data');

  // Decrypt
  const decryptedPassword = decryptVault(encryptedPayload, masterPassword);
  assert.strictEqual(decryptedPassword, secretPassword, 'Decrypted output must perfectly match original target string');
});

test('Crypto Engine - Should reject operations if the master password is wrong', () => {
  const encryptedPayload = encryptVault('secret', 'CorrectMasterPassword');

  assert.throws(
    () => {
      decryptVault(encryptedPayload, 'WrongMasterPassword');
    },
    /Authentication failed/,
    'Should raise standard authentication failure error on key divergence'
  );
});


// ==========================================
// 2. INTEGRATION TESTS: SQLite Database Operations
// ==========================================

test('Database Lifecycle - Adding, retrieving, and listing accounts', async (t) => {
  // Setup isolated memory arena safely inside this block execution scope
  await useMemoryDatabaseForTesting();
  await initDatabase();

  const masterPassword = 'SystemMasterKey';

  await t.test('Should successfully write a new credentials record row', async () => {
    const encryptedPayload = encryptVault('githubPass123', masterPassword);
    
    const rowsChanged = await saveCredential('github', 'octocat', encryptedPayload);
    assert.strictEqual(rowsChanged, 1, 'Database should verify exactly 1 altered row configuration');
  });

  await t.test('Should fetch and map rows dynamically from the credentials table', async () => {
    const record = await getCredential('github');
    
    assert.ok(record, 'A valid record row should return');
    assert.strictEqual(record.username, 'octocat', 'Stored username field mapping must remain true');
    
    const decryptedPassword = decryptVault(record.vault_payload, masterPassword);
    assert.strictEqual(decryptedPassword, 'githubPass123', 'Decrypted password value should be accurate');
  });

  await t.test('Should generate an ordered list array of all services on demand', async () => {
    const encryptedPayload2 = encryptVault('secret', masterPassword);
    await saveCredential('netflix', 'user@netflix.com', encryptedPayload2);

    const recordsList = await listAllServices();
    
    assert.strictEqual(recordsList.length, 2, 'Total schema listing counts should match record changes');
    assert.strictEqual(recordsList[0].service, 'github', 'Records must be implicitly sorted by alphabetical service key');
    assert.strictEqual(recordsList[1].service, 'netflix');
    assert.strictEqual(recordsList[0].vault_payload, undefined, 'List index returns must suppress raw payload properties');
  });
});