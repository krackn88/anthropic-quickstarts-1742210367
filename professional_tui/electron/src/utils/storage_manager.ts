import * as fs from 'fs-extra';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { notificationManager, NotificationType } from './notification_manager';

const compress = promisify(zlib.brotliCompress);
const decompress = promisify(zlib.brotliDecompress);

interface ModelStorageConfig {
  maxModelSize: number;
  compressionLevel: number;
  evictionStrategy: 'lru' | 'least_accessed';
}

interface ModelCacheEntry {
  modelName: string;
  timestamp: Date;
  size: number;
  accessCount: number;
}

export class DistributedModelStorage {
  private storageConfig: ModelStorageConfig;
  private modelAccessLog: Map<string, ModelCacheEntry> = new Map();

  constructor(
    private storagePath: string, 
    config?: Partial<ModelStorageConfig>
  ) {
    this.storageConfig = {
      maxModelSize: 100 * 1024, // 100GB per model
      compressionLevel: 9, // Maximum compression
      evictionStrategy: 'lru',
      ...config
    };

    // Ensure storage directory exists
    fs.ensureDirSync(path.join(this.storagePath, 'model_cache'));
  }

  async storeModelWeights(modelName: string, weights: Buffer): Promise<void> {
    try {
      const compressedWeights = await this.compressModelWeights(weights);
      const storagePath = this.getModelStoragePath(modelName);

      await fs.writeFile(storagePath, compressedWeights);
      this.updateModelAccessLog(modelName, compressedWeights.length);
      this.manageCacheSpace();

      notificationManager.notify({
        type: NotificationType.SUCCESS,
        title: 'Model Storage',
        message: `Successfully stored model: ${modelName}`
      });
    } catch (error) {
      notificationManager.notify({
        type: NotificationType.ERROR,
        title: 'Model Storage Error',
        message: `Failed to store model ${modelName}: ${error instanceof Error ? error.message : String(error)}`
      });
      throw error;
    }
  }

  async retrieveModelWeights(modelName: string): Promise<Buffer> {
    try {
      const storagePath = this.getModelStoragePath(modelName);
      const compressedWeights = await fs.readFile(storagePath);
      this.updateModelAccessCount(modelName);
      
      notificationManager.notify({
        type: NotificationType.INFO,
        title: 'Model Retrieval',
        message: `Successfully retrieved model: ${modelName}`
      });

      return await this.decompressModelWeights(compressedWeights);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
        ? error 
        : JSON.stringify(error);
      
      notificationManager.notify({
        type: NotificationType.ERROR,
        title: 'Model Retrieval Error',
        message: `Failed to retrieve model ${modelName}: ${errorMessage}`
      });

      throw new Error(`Model ${modelName} not found in storage: ${errorMessage}`);
    }
  }

  private getModelStoragePath(modelName: string): string {
    return path.join(this.storagePath, 'model_cache', `${modelName}.brotli`);
  }

  private async compressModelWeights(weights: Buffer): Promise<Buffer> {
    return await compress(weights, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: this.storageConfig.compressionLevel
      }
    });
  }

  private async decompressModelWeights(compressedWeights: Buffer): Promise<Buffer> {
    return await decompress(compressedWeights);
  }

  private updateModelAccessLog(modelName: string, size: number) {
    const now = new Date();
    const existingEntry = this.modelAccessLog.get(modelName);

    this.modelAccessLog.set(modelName, {
      modelName,
      timestamp: now,
      size,
      accessCount: existingEntry ? existingEntry.accessCount + 1 : 1
    });
  }

  private updateModelAccessCount(modelName: string) {
    const entry = this.modelAccessLog.get(modelName);
    if (entry) {
      entry.accessCount++;
      entry.timestamp = new Date();
    }
  }

  private manageCacheSpace() {
    const totalCacheSize = this.calculateTotalCacheSize();
    const maxCacheSize = this.calculateMaxCacheSize();

    if (totalCacheSize > maxCacheSize) {
      const bytesToFree = totalCacheSize - maxCacheSize;
      this.evictModels(bytesToFree);
      
      notificationManager.notify({
        type: NotificationType.WARNING,
        title: 'Cache Management',
        message: `Evicted ${bytesToFree} bytes to manage cache space`
      });
    }
  }

  private calculateTotalCacheSize(): number {
    return Array.from(this.modelAccessLog.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private calculateMaxCacheSize(): number {
    // Use 80% of available disk space
    const totalDiskSpace = this.getTotalDiskSpace();
    return Math.floor(totalDiskSpace * 0.8);
  }

  private getTotalDiskSpace(): number {
    const stats = fs.statSync(this.storagePath);
    return stats.size;
  }

  private evictModels(bytesToFree: number) {
    const sortedModels = Array.from(this.modelAccessLog.values())
      .sort((a, b) => {
        if (this.storageConfig.evictionStrategy === 'lru') {
          return a.timestamp.getTime() - b.timestamp.getTime();
        }
        return a.accessCount - b.accessCount;
      });

    let freedBytes = 0;
    for (const model of sortedModels) {
      if (freedBytes >= bytesToFree) break;

      const modelPath = this.getModelStoragePath(model.modelName);
      fs.removeSync(modelPath);
      this.modelAccessLog.delete(model.modelName);
      freedBytes += model.size;
    }
  }

  // Utility methods for external use
  async listCachedModels(): Promise<string[]> {
    return Array.from(this.modelAccessLog.keys());
  }

  async getCacheStats(): Promise<{
    totalModels: number;
    totalSize: number;
    availableSpace: number;
  }> {
    return {
      totalModels: this.modelAccessLog.size,
      totalSize: this.calculateTotalCacheSize(),
      availableSpace: this.calculateMaxCacheSize() - this.calculateTotalCacheSize()
    };
  }
}

export const modelStorage = new DistributedModelStorage(
  path.join(process.env.HOME || '', '.professional_tui', 'model_cache')
);
