import { modelStorage } from '../utils/storage_manager';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('DistributedModelStorage', () => {
  const testModelName = 'test-model';
  const testWeights = Buffer.from('test model weights');

  beforeEach(async () => {
    // Ensure clean state before each test
    const cacheDir = path.join(process.env.HOME || '', '.professional_tui', 'model_cache');
    await fs.remove(cacheDir);
    await fs.ensureDir(cacheDir);
  });

  it('should store and retrieve model weights', async () => {
    await modelStorage.storeModelWeights(testModelName, testWeights);
    
    const retrievedWeights = await modelStorage.retrieveModelWeights(testModelName);
    expect(retrievedWeights).toEqual(testWeights);
  });

  it('should list cached models', async () => {
    await modelStorage.storeModelWeights(testModelName, testWeights);
    
    const cachedModels = await modelStorage.listCachedModels();
    expect(cachedModels).toContain(testModelName);
  });

  it('should get cache stats', async () => {
    await modelStorage.storeModelWeights(testModelName, testWeights);
    
    const stats = await modelStorage.getCacheStats();
    expect(stats.totalModels).toBeGreaterThan(0);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it('should throw error when retrieving non-existent model', async () => {
    await expect(modelStorage.retrieveModelWeights('non-existent-model'))
      .rejects.toThrow('Model non-existent-model not found in storage');
  });
});
