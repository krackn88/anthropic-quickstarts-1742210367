import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { credentialManager } from '../utils/credentialManager';

// Mock setup must be before any imports that use the mocks
const mockAxiosInstance = jest.fn().mockResolvedValue({ data: {} });

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

describe('VastAIManager', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (credentialManager.getCredentials as jest.Mock).mockResolvedValue({
      vastaiApiKey: global.mockCredentials.vastaiApiKey,
    });
    mockAxiosInstance.mockResolvedValue({ data: mockOffers });
  });

  describe('Instance Management', () => {
    test('finds suitable instance based on model requirements', async () => {
      const manager = new VastAIManager();
      const instance = await manager.findSuitableInstance({
        minGPUs: 1,
        minVRAM: 8,
        minDLPerf: 20000,
      });
      expect(instance).toBeDefined();
      expect(instance?.gpu_name).toBe('RTX 4090');
    });

    test('returns null when no suitable instance found', async () => {
      const manager = new VastAIManager();
      const instance = await manager.findSuitableInstance({
        minGPUs: 4,
        minVRAM: 48,
        minDLPerf: 100000,
      });
      expect(instance).toBeNull();
    });

    test('creates instance with correct configuration', async () => {
      const manager = new VastAIManager();
      await manager.createInstance(mockOffers[0], {
        dockerImage: 'pytorch/pytorch:latest',
        startupScript: 'python train.py',
      });
      expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: expect.stringContaining('/instances/create'),
      }));
    });

    test('destroys instance and removes from active instances', async () => {
      const manager = new VastAIManager();
      const instanceId = 123;
      await manager.destroyInstance(instanceId);
      expect(mockAxiosInstance).toHaveBeenCalledWith(expect.objectContaining({
        method: 'DELETE',
        url: expect.stringContaining(`/instances/${instanceId}`),
      }));
    });
  });

  describe('Cost Management', () => {
    test('calculates current costs correctly', async () => {
      const manager = new VastAIManager();
      const costs = await manager.getCurrentCosts();
      expect(costs).toBeGreaterThanOrEqual(0);
    });

    test('stays within budget when creating instances', async () => {
      const manager = new VastAIManager();
      const withinBudget = await manager.checkBudget(mockOffers[0]);
      expect(withinBudget).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      mockAxiosInstance.mockRejectedValueOnce(new Error('API Error'));
      const manager = new VastAIManager();
      await expect(manager.findSuitableInstance({
        minGPUs: 1,
        minVRAM: 8,
      })).rejects.toThrow('API Error');
    });

    test('handles missing API key', async () => {
      (credentialManager.getCredentials as jest.Mock).mockResolvedValueOnce(null);
      const manager = new VastAIManager();
      await expect(manager.findSuitableInstance({
        minGPUs: 1,
        minVRAM: 8,
      })).rejects.toThrow('VastAI API key not found');
    });

    test('handles instance creation failure', async () => {
      mockAxiosInstance.mockRejectedValueOnce(new Error('Creation failed'));
      const manager = new VastAIManager();
      await expect(manager.createInstance(mockOffers[0], {
        dockerImage: 'pytorch/pytorch:latest',
      })).rejects.toThrow('Creation failed');
    });
  });

  describe('Model Configurations', () => {
    test('provides access to predefined model configurations', () => {
      expect(VastAIManager.MODEL_CONFIGS).toBeDefined();
      expect(Object.keys(VastAIManager.MODEL_CONFIGS).length).toBeGreaterThan(0);
    });

    test('validates model requirements against available instances', async () => {
      const manager = new VastAIManager();
      const config = VastAIManager.MODEL_CONFIGS.LLAMA_7B;
      const instance = await manager.findSuitableInstance(config);
      expect(instance).toBeDefined();
    });
  });
});
