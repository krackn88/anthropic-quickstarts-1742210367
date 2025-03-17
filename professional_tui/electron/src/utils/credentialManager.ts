import keytar from 'keytar';
import { app } from 'electron';
import crypto from 'crypto';

const SERVICE_NAME = 'cline-electron';

interface Credentials {
  claudeApiKey: string;
  githubPat: string;
  huggingfaceWriteKey: string;
  huggingfaceReadKey: string;
  vastaiApiKey: string;
}

class CredentialManager {
  private encryptionKey: Buffer;

  constructor() {
    // Generate a unique encryption key based on the machine ID
    const machineId = crypto
      .createHash('sha256')
      .update(app.getPath('userData'))
      .digest('hex');
    this.encryptionKey = Buffer.from(machineId, 'hex');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async saveCredentials(credentials: Credentials): Promise<void> {
    const encryptedCreds = this.encrypt(JSON.stringify(credentials));
    await keytar.setPassword(SERVICE_NAME, 'api-credentials', encryptedCreds);
  }

  async getCredentials(): Promise<Credentials | null> {
    const encryptedCreds = await keytar.getPassword(SERVICE_NAME, 'api-credentials');
    if (!encryptedCreds) return null;
    
    try {
      const decrypted = this.decrypt(encryptedCreds);
      return JSON.parse(decrypted) as Credentials;
    } catch (error) {
      console.error('Error decrypting credentials:', error);
      return null;
    }
  }

  async deleteCredentials(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, 'api-credentials');
  }

  async updateCredential(key: keyof Credentials, value: string): Promise<void> {
    const creds = await this.getCredentials() || {} as Credentials;
    creds[key] = value;
    await this.saveCredentials(creds);
  }

  // Validate API keys before saving
  static validateApiKey(key: string, type: keyof Credentials): boolean {
    switch (type) {
      case 'claudeApiKey':
        return /^sk-ant-api\d{2}-[a-zA-Z0-9_-]{48}$/.test(key);
      case 'githubPat':
        return /^github_pat_[a-zA-Z0-9_]{22,}$/.test(key);
      case 'huggingfaceWriteKey':
      case 'huggingfaceReadKey':
        return /^hf_[a-zA-Z0-9]{32,}$/.test(key);
      case 'vastaiApiKey':
        return /^[a-f0-9]{64}$/.test(key);
      default:
        return false;
    }
  }

  // Helper method to check if all required credentials are set
  async hasAllCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    if (!creds) return false;
    
    return Object.entries(creds).every(([key, value]) => {
      return value && CredentialManager.validateApiKey(value, key as keyof Credentials);
    });
  }
}

export const credentialManager = new CredentialManager();
export { CredentialManager };
export type { Credentials };
