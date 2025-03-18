import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { credentialManager } from '../utils/credentialManager';

// Mock setup must be before any imports that use the mocks
const mockAxiosInstance = jest.fn() as jest.Mock;

jest.mock('axios', () => ({
  __esModule: true,
  default: mockAxiosInstance,
  isAxiosError: (error: unknown): error is { isAxiosError: true } => {
    return typeof error === 'object' && error !== null && 'isAxiosError' in error;
  },
}));

// Import after mocks are set up
import { VastAIManager } from '../utils/vastai';

const mockOffers = [
  {
    id: 1,
    gpu_name: 'RTX 4090',
    dph_total: 0.5,
    cuda_max_good: 12,
    num_gpus: 1,
    reliability2: 0.98,
    disk_space: 100,
    dlperf: 25000,
    inet_up: 1000,
    inet_down: 1000,
  },
];

// Extend global with mock credentials
declare global {
  var mockCredentials: {
    vastaiApiKey: string;
  };
}

global.mockCredentials = {
  vastaiApiKey: 'test-api-key'
};

// Mock type for VastAI credentials
type VastAICredentials = {
  vastaiApiKey: string;
};

describe('VastAIManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Explicitly type the mock implementation
    (credentialManager.getCredentials as jest.Mock).mockImplementation((): Promise<VastAICredentials> => 
      Promise.resolve({
        vastaiApiKey: global.mockCredentials.vastaiApiKey,
      })
    );

    // Explicitly type the mock axios instance
    mockAxiosInstance.mockImplementation((): Promise<{ data: typeof mockOffers }> => 
      Promise.resolve({ data: mockOffers })
    );
  });

  describe('Instance Management', () => {
    test('finds suitable instance based on model requirements', async () => {
      const manager = new VastAIManager();
      
      // Explicitly type the mock return value
      mockAxiosInstance.mockImplementationOnce((): Promise<{ data: typeof mockOffers }> => 
        Promise.resolve({ data: mockOffers })
      );

      const instance = await manager.findSuitableInstance({
        minGPUs: 1,
        minVRAM: 8,
        minDLPerf: 20000,
      });
      expect(instance).toBeDefined();
      expect(instance?.gpu_name).toBe('RTX 4090');
    });

    test('returns null when no suitable instance found', async () => {
      // Explicitly type the mock return value
      mockAxiosInstance.mockImplementationOnce((): Promise<{ data: never[] }> => 
        Promise.resolve({ data: [] })
      );

      const manager = new VastAIManager();
      const instance = await manager.findSuitableInstance({
        minGPUs: 4,
        minVRAM: 48,
        minDLPerf: 100000,
      });
      expect(instance).toBeNull();
    });
  });
});
