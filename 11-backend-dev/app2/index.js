#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import { encryptVault, decryptVault, generateSecurePassword } from './src/crypto-utils.js';

const program = new Command();
const VAULT_FILE = './data/vault.json';

// Helper to prompt for the master password securely
async function askMasterPassword() {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'masterPassword',
      message: 'Enter your Master Password:',
      mask: '*'
    }
  ]);
  return answers.masterPassword;
}

program
  .name('pm')
  .description('A secure, local Node.js password manager')
  .version('1.0.0');

// COMMAND: ADD A NEW PASSWORD
program
  .command('add')
  .description('Save a new account credential')
  .action(async () => {
    const masterPassword = await askMasterPassword();
    
    const credentials = await inquirer.prompt([
      { type: 'input', name: 'site', message: 'Website/Service:' },
      { type: 'input', name: 'username', message: 'Username/Email:' },
      { type: 'password', name: 'password', message: 'Password:', mask: '*' }
    ]);

    let currentVaultData = {};

    // Read and decrypt existing vault if it exists
    if (fs.existsSync(VAULT_FILE)) {
      try {
        const rawFile = fs.readFileSync(VAULT_FILE, 'utf8');
        currentVaultData = decryptVault(rawFile, masterPassword);
      } catch (err) {
        console.log(chalk.red('\n❌ Error: Invalid master password!'));
        process.exit(1);
      }
    }

    // Append new credential
    currentVaultData[credentials.site] = {
      username: credentials.username,
      password: credentials.password,
      updatedAt: new Date().toISOString()
    };

    // Re-encrypt and write back to disk
    const encryptedRaw = encryptVault(JSON.stringify(currentVaultData), masterPassword);
    fs.writeFileSync(VAULT_FILE, encryptedRaw, 'utf8');
    
    console.log(chalk.green(`\n✔ Successfully saved credentials for ${credentials.site}!`));
  });

// COMMAND: GET A PASSWORD
program
  .command('get')
  .description('Retrieve credentials for a service')
  .argument('<service>', 'Name of the service (e.g., github)')
  .action(async (service) => {
    if (!fs.existsSync(VAULT_FILE)) {
      console.log(chalk.yellow("No vault file found. Use 'pm add' to create one."));
      return;
    }

    const masterPassword = await askMasterPassword();

    try {
      const rawFile = fs.readFileSync(VAULT_FILE, 'utf8');
      const vaultData = decryptVault(rawFile, masterPassword);

      const entry = vaultData[service];
      if (!entry) {
        console.log(chalk.yellow(`\nNo entry found for service: "${service}"`));
        return;
      }

      console.log(chalk.cyan(`\n--- Credentials for ${service} ---`));
      console.log(`Username: ${entry.username}`);
      console.log(`Password: ${entry.password}`);
    } catch (err) {
      console.log(chalk.red('\n❌ Error: Decryption failed.'));
    }
  });

// COMMAND: LIST ALL SERVICES
program
  .command('list')
  .description('List all services saved in the vault')
  .action(async () => {
    if (!fs.existsSync(VAULT_FILE)) {
      console.log(chalk.yellow("No vault file found. Use 'pm add' to create one."));
      return;
    }

    const masterPassword = await askMasterPassword();

    try {
      const rawFile = fs.readFileSync(VAULT_FILE, 'utf8');
      const vaultData = decryptVault(rawFile, masterPassword);

      const services = Object.keys(vaultData);

      if (services.length === 0) {
        console.log(chalk.yellow('\nYour vault is currently empty.'));
        return;
      }

      console.log(chalk.cyan(`\n--- Stored Accounts (${services.length}) ---`));
      services.forEach((service) => {
        const entry = vaultData[service];
        // Print the service name and username, but mask the password count for safety
        console.log(`• ${chalk.bold(service)} [Username: ${entry.username}]`);
      });
      console.log(chalk.cyan('---------------------------'));
      
    } catch (err) {
      console.log(chalk.red('\n❌ Error: Decryption failed. Invalid master password!'));
    }
  });

// COMMAND: GENERATE PASSWORD
program
  .command('generate')
  .description('Generate a secure, cryptographically random password')
  .option('-l, --length <number>', 'Length of the password', '16')
  .option('--no-symbols', 'Exclude special characters/symbols')
  .action((options) => {
    const length = parseInt(options.length, 10);

    // Basic sanity checks
    if (isNaN(length) || length < 6 || length > 128) {
      console.log(chalk.red('❌ Error: Password length must be a number between 6 and 128.'));
      return;
    }

    const password = generateSecurePassword(length, options.symbols);
    
    console.log(chalk.cyan('\n--- Generated Secure Password ---'));
    console.log(chalk.green.bold(password));
  });

program.parse();