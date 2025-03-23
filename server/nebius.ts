// Nebius API integration for Smart Meal Planner
import axios from 'axios';

// Nebius API configuration
interface NebiusConfig {
  apiKey: string;
  endpoint: string;
}

// Initialize Nebius client
class NebiusClient {
  private config: NebiusConfig;
  
  constructor(config: NebiusConfig) {
    this.config = config;
  }
  
  // Helper method for API requests
  private async makeRequest(path: string, method: string, data?: any) {
    try {
      // Ensure endpoint has proper URL format
      const baseUrl = this.config.endpoint.startsWith('http') 
        ? this.config.endpoint 
        : `https://${this.config.endpoint}`;
      
      const response = await axios({
        method,
        url: new URL(path, baseUrl).toString(),
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error) {
      console.error('Nebius API error:', error);
      throw error;
    }
  }
  
  // Image analysis for ingredient detection
  async analyzeImage(imageBase64: string) {
    // Remove data URL prefix if present
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64;
      
    return this.makeRequest('/vision/analyze', 'POST', {
      image: {
        content: base64Data
      },
      features: [
        { type: 'OBJECT_DETECTION' },
        { type: 'LABEL_DETECTION' }
      ]
    });
  }
  
  // Recipe recommendations based on ingredients
  async getRecipeRecommendations(ingredients: string[], preferences: any = {}) {
    return this.makeRequest('/ai/generate', 'POST', {
      prompt: {
        text: `Generate recipes using these ingredients: ${ingredients.join(", ")}. 
               Preferences: ${JSON.stringify(preferences)}. 
               Return JSON with title, ingredients, instructions, and nutritional info.`
      },
      outputFormat: 'JSON'
    });
  }
  
  // Database operations
  async queryDatabase(query: string, params: any = {}) {
    return this.makeRequest('/database/query', 'POST', {
      query,
      params
    });
  }
}

// Create and export the Nebius client
export const createNebiusClient = () => {
  const apiKey = process.env.NEBIUS_API_KEY;
  const endpoint = process.env.NEBIUS_ENDPOINT || 'https://api.nebius.cloud/v1';
  
  if (!apiKey) {
    console.warn('NEBIUS_API_KEY environment variable not set. Nebius features will not work.');
    return null;
  }
  
  return new NebiusClient({ apiKey, endpoint });
};

export const nebiusClient = createNebiusClient();