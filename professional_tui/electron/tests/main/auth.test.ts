import { jest } from '@jest/globals';
import keytar from 'keytar';
import { AuthService } from '../../src/main/services/auth';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('setApiKey', () => {
    it('should store API key securely', async () => {
      const apiKey = 'test-api-key';
      await authService.setApiKey(apiKey);
      expect(keytar.setPassword).toHaveBeenCalledWith('cline', 'anthropic-api-key', apiKey);
    });
  });

  describe('getApiKey', () => {
    it('should retrieve stored API key', async () => {
      const mockApiKey = 'stored-api-key';
      (keytar.getPassword as jest.Mock).mockResolvedValue(mockApiKey);
      
      const result = await authService.getApiKey();
      expect(result).toBe(mockApiKey);
      expect(keytar.getPassword).toHaveBeenCalledWith('cline', 'anthropic-api-key');
    });
  });
});
