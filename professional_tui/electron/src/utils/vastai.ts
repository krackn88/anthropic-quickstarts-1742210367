import axios from 'axios';
import { credentialManager } from './credentialManager';

interface ModelRequirements {
  minGPUs: number;
  minVRAM: number;
  minDLPerf?: number;
}

interface InstanceConfig {
  dockerImage: string;
  startupScript?: string;
}

interface VastAIOffer {
  id: number;
  gpu_name: string;
  dph_total: number;
  cuda_max_good: number;
  num_gpus: number;
  reliability2: number;
  disk_space: number;
  dlperf: number;
  inet_up: number;
  inet_down: number;
}

export class VastAIManager {
  private apiKey: string | null = null;
  private activeInstances: Set<number> = new Set();

  static readonly MODEL_CONFIGS = {
    LLAMA_7B: {
      minGPUs: 1,
      minVRAM: 16,
      minDLPerf: 20000,
    },
    LLAMA_13B: {
      minGPUs: 1,
      minVRAM: 24,
      minDLPerf: 25000,
    },
    LLAMA_70B: {
      minGPUs: 2,
      minVRAM: 48,
      minDLPerf: 40000,
    },
  } as const;

  private async getApiKey(): Promise<string> {
    const credentials = await credentialManager.getCredentials();
    if (!credentials?.vastaiApiKey) {
      throw new Error('VastAI API key not found');
    }
    return credentials.vastaiApiKey;
  }

  async findSuitableInstance(requirements: ModelRequirements): Promise<VastAIOffer | null> {
    try {
      this.apiKey = await this.getApiKey();
      const response = await axios({
        method: 'GET',
        url: 'https://vast.ai/api/v0/bundles',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const offers: VastAIOffer[] = response.data;
      return offers.find(offer => 
        offer.num_gpus >= requirements.minGPUs &&
        offer.cuda_max_good >= requirements.minVRAM &&
        (!requirements.minDLPerf || offer.dlperf >= requirements.minDLPerf)
      ) || null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  async createInstance(offer: VastAIOffer, config: InstanceConfig): Promise<number> {
    try {
      this.apiKey = await this.getApiKey();
      const response = await axios({
        method: 'POST',
        url: 'https://vast.ai/api/v0/instances/create',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        data: {
          offer_id: offer.id,
          image: config.dockerImage,
          runtype: 'args',
          client_id: 'me',
          image_args: config.startupScript || '',
        },
      });

      const instanceId = response.data.instance_id;
      this.activeInstances.add(instanceId);
      return instanceId;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  async destroyInstance(instanceId: number): Promise<void> {
    try {
      this.apiKey = await this.getApiKey();
      await axios({
        method: 'DELETE',
        url: `https://vast.ai/api/v0/instances/${instanceId}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      this.activeInstances.delete(instanceId);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  async getCurrentCosts(): Promise<number> {
    try {
      this.apiKey = await this.getApiKey();
      const response = await axios({
        method: 'GET',
        url: 'https://vast.ai/api/v0/users/current',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.data.current_cost || 0;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
      }
      throw error;
    }
  }

  async checkBudget(offer: VastAIOffer): Promise<boolean> {
    const currentCosts = await this.getCurrentCosts();
    const hourlyRate = offer.dph_total;
    const maxBudget = 100; // $100 budget limit
    const projectedCost = currentCosts + (hourlyRate * 24); // Project 24 hours of usage
    return projectedCost <= maxBudget;
  }
}
