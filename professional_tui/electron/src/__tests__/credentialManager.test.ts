import { credentialManager, CredentialManager, Credentials } from '../utils/credentialManager';
import keytar from 'keytar';
import { app } from 'electron';

// Mock external dependencies
jest.mock('keytar');
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('test-user-data-path'),
  },
}));

describe('CredentialManager', () => {
  // Reset mocks before each test
  const mockCredentials = {
    claudeApiKey: 'sk-ant-api03-valid-key-48chars-long-string-test-string-ok',
    githubPat: 'github_pat_valid_test_token_string_here_1234567890abc',
    huggingfaceWriteKey: 'hf_valid_test_token_string_here_1234567890abc',
    huggingfaceReadKey: 'hf_valid_test_token_string_here_0987654321xyz',
    vastaiApiKey: 'a'.repeat(64),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllMocks();
  });

  describe('API Key Validation', () => {
    test('validates Claude API key', () => {
      expect(CredentialManager.validateApiKey(mockCredentials.claudeApiKey, 'claudeApiKey')).toBe(true);
      expect(CredentialManager.validateApiKey('invalid-key', 'claudeApiKey')).toBe(false);
    });

    test('validates GitHub PAT', () => {
      expect(CredentialManager.validateApiKey(mockCredentials.githubPat, 'githubPat')).toBe(true);
      expect(CredentialManager.validateApiKey('invalid-pat', 'githubPat')).toBe(false);
    });

    test('validates Hugging Face keys', () => {
      expect(CredentialManager.validateApiKey(mockCredentials.huggingfaceWriteKey, 'huggingfaceWriteKey')).toBe(true);
      expect(CredentialManager.validateApiKey(mockCredentials.huggingfaceReadKey, 'huggingfaceReadKey')).toBe(true);
      expect(CredentialManager.validateApiKey('invalid-key', 'huggingfaceWriteKey')).toBe(false);
    });

    test('validates Vast.ai API key', () => {
      expect(CredentialManager.validateApiKey(mockCredentials.vastaiApiKey, 'vastaiApiKey')).toBe(true);
      expect(CredentialManager.validateApiKey('invalid-key', 'vastaiApiKey')).toBe(false);
    });
  });

  describe('Credential Storage', () => {
    test('saves and retrieves credentials', async () => {
      // Mock keytar functions
      (keytar.setPassword as jest.Mock).mockResolvedValue(undefined);
      (keytar.getPassword as jest.Mock).mockImplementation((service, account) => {
        // Return the last saved encrypted value
        const lastCall = (keytar.setPassword as jest.Mock).mock.calls[0];
        return Promise.resolve(lastCall ? lastCall[2] : null);
      });

      // Save credentials
      await credentialManager.saveCredentials(mockCredentials);
      expect(keytar.setPassword).toHaveBeenCalled();

      // Retrieve credentials
      const retrieved = await credentialManager.getCredentials();
      expect(retrieved).toEqual(mockCredentials);
    });

    test('handles missing credentials', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValue(null);
      const retrieved = await credentialManager.getCredentials();
      expect(retrieved).toBeNull();
    });

    test('updates individual credentials', async () => {
      // Mock initial state
      (keytar.getPassword as jest.Mock).mockResolvedValue(null);
      
      // Update a single credential
      const newClaudeKey = 'sk-ant-api03-new-valid-key-48chars-long-string-test-ok';
      await credentialManager.updateCredential('claudeApiKey', newClaudeKey);
      
      // Verify the update
      const savedCreds = await credentialManager.getCredentials();
      expect(savedCreds?.claudeApiKey).toBe(newClaudeKey);
    });

    test('deletes credentials', async () => {
      (keytar.deletePassword as jest.Mock).mockResolvedValue(true);
      await credentialManager.deleteCredentials();
      expect(keytar.deletePassword).toHaveBeenCalled();
    });
  });

  describe('Credential Validation', () => {
    test('checks if all credentials are valid', async () => {
      // Mock credentials storage
      (keytar.getPassword as jest.Mock).mockResolvedValue(
        credentialManager['encrypt'](JSON.stringify(mockCredentials))
      );

      const hasAll = await credentialManager.hasAllCredentials();
      expect(hasAll).toBe(true);
    });

    test('detects invalid credentials', async () => {
      const invalidCreds = { ...mockCredentials, claudeApiKey: 'invalid-key' };
      (keytar.getPassword as jest.Mock).mockResolvedValue(
        credentialManager['encrypt'](JSON.stringify(invalidCreds))
      );

      const hasAll = await credentialManager.hasAllCredentials();
      expect(hasAll).toBe(false);
    });
  });

  describe('Encryption', () => {
    test('encrypts and decrypts data correctly', () => {
      const testData = 'test-secret-data';
      const encrypted = credentialManager['encrypt'](testData);
      const decrypted = credentialManager['decrypt'](encrypted);
      expect(decrypted).toBe(testData);
    });

    test('handles encryption errors gracefully', async () => {
      (keytar.getPassword as jest.Mock).mockResolvedValue('invalid:encrypted:data');
      const retrieved = await credentialManager.getCredentials();
      expect(retrieved).toBeNull();
    });
  });
});
