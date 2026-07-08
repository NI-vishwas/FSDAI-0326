#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { encryptVault, decryptVault } from './src/crypto-utils.js';
import { initDatabase, saveCredential, getCredential, listAllServices } from './src/db-util.js';

const program = new Command();

// Ensure the SQLite tables are built before handling commands
await initDatabase();

async function askMasterPassword() {
  const answers = await inquirer.prompt([
    { type: 'password', name: 'masterPassword', message: 'Enter your Master Password:', mask: '*' }
  ]);
  return answers.masterPassword;
}

program
  .name('pm')
  .description('A secure, database-backed Node.js password manager')
  .version('2.0.0');

// COMMAND: ADD / UPDATE
program
  .command('add')
  .description('Save or update an account credential')
  .action(async () => {
    const masterPassword = await askMasterPassword();
    
    const credentials = await inquirer.prompt([
      { type: 'input', name: 'site', message: 'Website/Service:' },
      { type: 'input', name: 'username', message: 'Username/Email:' },
      { type: 'password', name: 'password', message: 'Password:', mask: '*' }
    ]);

    // We only encrypt the sensitive password string itself to keep SQL records cleanly queryable
    const encryptedPayload = encryptVault(credentials.password, masterPassword);

    try {
      await saveCredential(credentials.site, credentials.username, encryptedPayload);
      console.log(chalk.green(`\n✔ Successfully saved credentials for ${credentials.site} in the local database!`));
    } catch (err) {
      console.log(chalk.red(`\n❌ Error saving to database: ${err.message}`));
    }
  });

// COMMAND: GET
program
  .command('get')
  .description('Retrieve credentials for a service')
  .argument('<service>', 'Name of the service')
  .action(async (service) => {
    const record = await getCredential(service);

    if (!record) {
      console.log(chalk.yellow(`\nNo entry found for service: "${service}"`));
      return;
    }

    const masterPassword = await askMasterPassword();

    try {
      // Unpack the encrypted payload column using the master password
      const decryptedPassword = decryptVault(record.vault_payload, masterPassword);

      console.log(chalk.cyan(`\n--- Credentials for ${record.service} ---`));
      console.log(`Username: ${record.username}`);
      console.log(`Password: ${decryptedPassword}`);
    } catch (err) {
      console.log(chalk.red('\n❌ Error: Decryption failed. Wrong master password!'));
    }
  });

// COMMAND: LIST
program
  .command('list')
  .description('List all services saved in the database')
  .action(async () => {
    try {
      const records = await listAllServices();

      if (records.length === 0) {
        console.log(chalk.yellow('\nYour database vault is currently empty.'));
        return;
      }

      console.log(chalk.cyan(`\n--- Stored Database Accounts (${records.length}) ---`));
      records.forEach((row) => {
        console.log(`• ${chalk.bold(row.service)} [Username: ${row.username}]`);
      });
      console.log(chalk.cyan('--------------------------------------------'));
    } catch (err) {
      console.log(chalk.red(`\n❌ Error reading database: ${err.message}`));
    }
  });

program.parse();