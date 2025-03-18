import keytar from 'keytar';
import { app } from 'electron';
import crypto from 'crypto';

const SERVICE_NAME = 'cline';

export interface Credentials {
  anthropicApiKey: string;
  openaiApiKey: string;
  huggingfaceApiKey?: string;
  googleApiKey?: string;
  selectedModel?: string;
}

export class CredentialManager {
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

  /**
   * Get all stored credentials
   * @returns Promise resolving to credentials or null if none are found
   */
  async getCredentials(): Promise<Credentials | null> {
    try {
      // Fetch all stored credentials
      const anthropicApiKey = await keytar.getPassword(SERVICE_NAME, 'anthropic-api-key') || '';
      const openaiApiKey = await keytar.getPassword(SERVICE_NAME, 'openai-api-key') || '';
      const huggingfaceApiKey = await keytar.getPassword(SERVICE_NAME, 'huggingface-api-key') || '';
      const googleApiKey = await keytar.getPassword(SERVICE_NAME, 'google-api-key') || '';
      const selectedModel = await keytar.getPassword(SERVICE_NAME, 'selected-model') || 'claude-3-opus';

      // Return null if no credentials are stored
      if (!anthropicApiKey && !openaiApiKey && !huggingfaceApiKey && !googleApiKey) {
        return null;
      }

      return {
        anthropicApiKey,
        openaiApiKey,
        huggingfaceApiKey: huggingfaceApiKey || undefined,
        googleApiKey: googleApiKey || undefined,
        selectedModel
      };
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw new Error(`Failed to get credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save credentials
   * @param credentials The credentials to save
   */
  async saveCredentials(credentials: Credentials): Promise<void> {
    try {
      if (credentials.anthropicApiKey) {
        await keytar.setPassword(SERVICE_NAME, 'anthropic-api-key', credentials.anthropicApiKey);
      }
      
      if (credentials.openaiApiKey) {
        await keytar.setPassword(SERVICE_NAME, 'openai-api-key', credentials.openaiApiKey);
      }
      
      if (credentials.huggingfaceApiKey) {
        await keytar.setPassword(SERVICE_NAME, 'huggingface-api-key', credentials.huggingfaceApiKey);
      }
      
      if (credentials.googleApiKey) {
        await keytar.setPassword(SERVICE_NAME, 'google-api-key', credentials.googleApiKey);
      }
      
      if (credentials.selectedModel) {
        await keytar.setPassword(SERVICE_NAME, 'selected-model', credentials.selectedModel);
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw new Error(`Failed to save credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a single credential
   * @param key The credential key to update
   * @param value The new value for the credential
   */
  async updateCredential(key: keyof Credentials, value: string): Promise<void> {
    try {
      let keytarKey = '';
      
      switch (key) {
        case 'anthropicApiKey':
          keytarKey = 'anthropic-api-key';
          break;
        case 'openaiApiKey':
          keytarKey = 'openai-api-key';
          break;
        case 'huggingfaceApiKey':
          keytarKey = 'huggingface-api-key';
          break;
        case 'googleApiKey':
          keytarKey = 'google-api-key';
          break;
        case 'selectedModel':
          keytarKey = 'selected-model';
          break;
        default:
          throw new Error(`Unknown credential key: ${key}`);
      }
      
      await keytar.setPassword(SERVICE_NAME, keytarKey, value);
    } catch (error) {
      console.error(`Error updating credential ${key}:`, error);
      throw new Error(`Failed to update credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Delete a single credential
   * @param key The credential key to delete
   */
  async deleteCredential(key: keyof Credentials): Promise<boolean> {
    try {
      let keytarKey = '';
      
      switch (key) {
        case 'anthropicApiKey':
          keytarKey = 'anthropic-api-key';
          break;
        case 'openaiApiKey':
          keytarKey = 'openai-api-key';
          break;
        case 'huggingfaceApiKey':
          keytarKey = 'huggingface-api-key';
          break;
        case 'googleApiKey':
          keytarKey = 'google-api-key';
          break;
        case 'selectedModel':
          keytarKey = 'selected-model';
          break;
        default:
          throw new Error(`Unknown credential key: ${key}`);
      }
      
      return await keytar.deletePassword(SERVICE_NAME, keytarKey);
    } catch (error) {
      console.error(`Error deleting credential ${key}:`, error);
      throw new Error(`Failed to delete credential: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clear all credentials
   */
  async clearCredentials(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, 'anthropic-api-key');
      await keytar.deletePassword(SERVICE_NAME, 'openai-api-key');
      await keytar.deletePassword(SERVICE_NAME, 'huggingface-api-key');
      await keytar.deletePassword(SERVICE_NAME, 'google-api-key');
      await keytar.deletePassword(SERVICE_NAME, 'selected-model');
    } catch (error) {
      console.error('Error clearing credentials:', error);
      throw new Error(`Failed to clear credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate an API key based on type
   * @param key The API key to validate
   * @param type The type of API key
   * @returns boolean indicating if the key is valid
   */
  static validateApiKey(key: string, type: keyof Credentials): boolean {
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return false;
    }

    // Type-specific validations
    switch (type) {
      case 'anthropicApiKey':
        // Claude API keys format validation
        return key.startsWith('sk-ant-') && key.length >= 25;
      case 'openaiApiKey':
        // OpenAI API keys validation
        return key.startsWith('sk-') && key.length >= 40;
      case 'huggingfaceApiKey': 
        // Huggingface API keys typically start with "hf_"
        return key.startsWith('hf_') && key.length >= 25;
      case 'googleApiKey':
        // Google API keys validation
        return key.length >= 20;
      default:
        // Default validation - just ensure we have a non-empty string
        return key.length > 0;
    }
  }
}

// Export a singleton instance
export const credentialManager = new CredentialManager();
