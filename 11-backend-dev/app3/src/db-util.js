import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//  Safe absolute path (creates/opens 'dev.db' in the same folder as this file)
// Switch file paths automatically based on the environment flag
const DB_FILE = process.env.NODE_ENV === 'test' 
  ? path.resolve('./vault.test.db') 
  : path.resolve('./vault.db');

const dbPath = path.resolve(__dirname, 'vault.db');

// const DB_FILE = path.resolve(dbPath);

// Initialize database connection
const db = new sqlite3.Database(DB_FILE);

/**
 * Creates the credentials table if it doesn't already exist
 */
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        vault_payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Inserts or replaces an encrypted credential row
 */
export function saveCredential(service, username, vaultPayload) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT OR REPLACE INTO credentials (service, username, vault_payload, updated_at)
      VALUES (?, ?, ?, ?)
    `;
    const now = new Date().toISOString();
    db.run(query, [service.toLowerCase(), username, vaultPayload, now], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

/**
 * Retrieves a single service row
 */
export function getCredential(service) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM credentials WHERE service = ?`, [service.toLowerCase()], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * Fetches all service names and usernames (without payloads)
 */
export function listAllServices() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT service, username FROM credentials ORDER BY service ASC`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

/**
 * Allows the test suite to re-target the database configuration to memory
 */
export function useMemoryDatabaseForTesting() {
  return new Promise((resolve) => {
    db.close(() => {
      // Re-assign database file pointer to an absolute isolated memory state
      const memoryDb = new sqlite3.Database(':memory:');
      
      // Override internal methods globally for this execution context
      db.run = memoryDb.run.bind(memoryDb);
      db.get = memoryDb.get.bind(memoryDb);
      db.all = memoryDb.all.bind(memoryDb);
      
      resolve();
    });
  });
}