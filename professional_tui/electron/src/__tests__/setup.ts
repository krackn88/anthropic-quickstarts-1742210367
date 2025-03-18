// Global setup for Jest tests
import * as fs from 'fs-extra';
import * as path from 'path';

// Ensure clean test environment
beforeAll(async () => {
  const testCacheDir = path.join(process.env.HOME || '', '.professional_tui', 'test_model_cache');
  await fs.ensureDir(testCacheDir);
});

// Clean up after tests
afterAll(async () => {
  const testCacheDir = path.join(process.env.HOME || '', '.professional_tui', 'test_model_cache');
  await fs.remove(testCacheDir);
});
