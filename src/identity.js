/**
 * KDNA Identity — Ed25519 key pair generation and management.
 *
 * Commands:
 *   identity init           Generate key pair
 *   identity show           Display public key and buyer_id
 *   identity export [--out]  Backup private key (age-encrypted)
 *   identity import <file>   Restore from backup
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IDENTITY_DIR =
  process.env.KDNA_IDENTITY_DIR ||
  path.join(process.env.HOME || process.env.USERPROFILE || '.', '.kdna', 'identity');

const PRIVATE_KEY_PATH = path.join(IDENTITY_DIR, 'kdna.key');
const PUBLIC_KEY_PATH = path.join(IDENTITY_DIR, 'kdna.pub');

function error(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// ─── Key Generation ────────────────────────────────────────────────────

function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

function deriveBuyerId(publicKeyPem) {
  return crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 16);
}

function fingerprint(publicKeyPem) {
  return crypto.createHash('sha256').update(publicKeyPem).digest('hex').substring(0, 12);
}

function cmdIdentityInit() {
  if (fs.existsSync(PRIVATE_KEY_PATH)) {
    const pub = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    const id = deriveBuyerId(pub);
    console.log(`Identity already exists.`);
    console.log(`  Buyer ID:  ${id}`);
    console.log(`  Public:    ${PUBLIC_KEY_PATH}`);
    console.log(`  Private:   ${PRIVATE_KEY_PATH}`);
    return;
  }

  fs.mkdirSync(IDENTITY_DIR, { recursive: true });

  const { publicKey, privateKey } = generateKeyPair();

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

  const id = deriveBuyerId(publicKey);
  const fp = fingerprint(publicKey);

  console.log(`✓ Identity created.`);
  console.log(`  Buyer ID:     ${id}`);
  console.log(`  Fingerprint:  ${fp}`);
  console.log(`  Public key:   ${PUBLIC_KEY_PATH}`);
  console.log(`  Private key:  ${PRIVATE_KEY_PATH} (chmod 600)`);
  console.log('');
  console.log(`  Backup your private key immediately:`);
  console.log(`    kdna identity export --out kdna-identity-backup.age`);
}

// ─── Show ──────────────────────────────────────────────────────────────

function cmdIdentityShow() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    error('No identity found. Run: kdna identity init');
  }

  const pub = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  const id = deriveBuyerId(pub);
  const fp = fingerprint(pub);

  console.log(`Buyer ID:     ${id}`);
  console.log(`Fingerprint:  ${fp}`);
  console.log(`Public key:   ${PUBLIC_KEY_PATH}`);
  console.log(
    `Private key:  ${PRIVATE_KEY_PATH} ${fs.existsSync(PRIVATE_KEY_PATH) ? '(exists)' : '(MISSING!)'}`,
  );
}

// ─── Export (backup) ───────────────────────────────────────────────────

function cmdIdentityExport(outFile) {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    error('No private key found. Run: kdna identity init');
  }

  const outPath = path.resolve(outFile || 'kdna-identity-backup.age');
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  // Simple passphrase-encrypted backup using built-in crypto
  // Uses AES-256-CBC with PBKDF2 key derivation
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });

  rl.question('Enter passphrase (or leave empty to abort): ', (passphrase) => {
    rl.close();
    if (!passphrase) {
      console.log('Aborted.');
      process.exit(0);
    }

    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    const header = JSON.stringify({
      alg: 'pbkdf2+aes-256-cbc',
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
    });
    const headerB64 = Buffer.from(header).toString('base64');

    const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);

    const output = `-----BEGIN KDNA IDENTITY BACKUP-----\n${headerB64}\n${encrypted.toString('base64')}\n-----END KDNA IDENTITY BACKUP-----\n`;

    fs.writeFileSync(outPath, output, { mode: 0o600 });
    console.log(`✓ Identity exported to: ${outPath}`);
    console.log(`  Keep this file safe. It is encrypted with your passphrase.`);
    process.exit(0);
  });
}

// ─── Import (restore) ──────────────────────────────────────────────────

function cmdIdentityImport(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) error(`File not found: ${abs}`);

  const content = fs.readFileSync(abs, 'utf8');
  const match = content.match(
    /-----BEGIN KDNA IDENTITY BACKUP-----\n(.+?)\n(.+?)\n-----END KDNA IDENTITY BACKUP-----/s,
  );
  if (!match) error('Invalid backup file format.');

  const header = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  if (header.alg !== 'pbkdf2+aes-256-cbc') error(`Unsupported algorithm: ${header.alg}`);

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });

  rl.question('Enter passphrase: ', (passphrase) => {
    rl.close();
    if (!passphrase) {
      console.log('Aborted.');
      process.exit(0);
    }

    const salt = Buffer.from(header.salt, 'base64');
    const iv = Buffer.from(header.iv, 'base64');
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    try {
      const encrypted = Buffer.from(match[2], 'base64');
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
        'utf8',
      );

      fs.mkdirSync(IDENTITY_DIR, { recursive: true });
      fs.writeFileSync(PRIVATE_KEY_PATH, decrypted, { mode: 0o600 });

      // Derive public key from private
      const privateKeyObj = crypto.createPrivateKey({
        key: decrypted,
        format: 'pem',
        type: 'pkcs8',
      });
      const publicKey = crypto
        .createPublicKey(privateKeyObj)
        .export({ type: 'spki', format: 'pem' });
      fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

      const id = deriveBuyerId(publicKey);
      console.log(`✓ Identity restored.`);
      console.log(`  Buyer ID:  ${id}`);
    } catch {
      console.log('Error: Incorrect passphrase or corrupted backup.');
      process.exit(1);
    }
    process.exit(0);
  });
}

module.exports = {
  cmdIdentityInit,
  cmdIdentityShow,
  cmdIdentityExport,
  cmdIdentityImport,
  PRIVATE_KEY_PATH,
  PUBLIC_KEY_PATH,
  IDENTITY_DIR,
  fingerprint,
  deriveBuyerId,
};
