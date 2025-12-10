// src/services/assetApiService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (tenantId) {
    headers['X-Tenant-ID'] = tenantId;
  }
  
  return headers;
};

const assetApiService = {
  // Get all assets for tenant
  async getAllAssets(tenantId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/tenant/${tenantId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      return await response.json();
    } catch (error) {
      console.error('Get assets error:', error);
      throw error;
    }
  },

  // Add new asset
  async addAsset(assetData) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assetData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add asset');
      }

      return await response.json();
    } catch (error) {
      console.error('Add asset error:', error);
      throw error;
    }
  },

  // Update asset
  async updateAsset(assetId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update asset');
      }

      return await response.json();
    } catch (error) {
      console.error('Update asset error:', error);
      throw error;
    }
  },

  // Delete asset
  async deleteAsset(assetId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete asset error:', error);
      throw error;
    }
  },

  // Get AI analysis for asset
  async getAIAnalysis(assetId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/ai-analysis`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      return await response.json();
    } catch (error) {
      console.error('Get AI analysis error:', error);
      throw error;
    }
  },

  // Get market rates
  async getMarketRates(assetType, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/assets/market-rates/${assetType}${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get market rates');
      }

      return await response.json();
    } catch (error) {
      console.error('Get market rates error:', error);
      throw error;
    }
  },

  // Verify asset data integrity
  async verifyAssetData(assetId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${assetId}/verify`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to verify asset data');
      }

      return await response.json();
    } catch (error) {
      console.error('Verify asset error:', error);
      throw error;
    }
  },

  // Bulk verify assets
  async bulkVerifyAssets(tenantId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/tenant/${tenantId}/bulk-verify`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to bulk verify assets');
      }

      return await response.json();
    } catch (error) {
      console.error('Bulk verify error:', error);
      throw error;
    }
  },

  // Get today's gold rate
  async getTodayGoldRate() {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/gold-rate/today`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get gold rate');
      }

      return await response.json();
    } catch (error) {
      console.error('Get gold rate error:', error);
      throw error;
    }
  },

  // Get market overview
  async getMarketOverview() {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/market/overview`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get market overview');
      }

      return await response.json();
    } catch (error) {
      console.error('Get market overview error:', error);
      throw error;
    }
  },

  // Get market suggestions
  async getMarketSuggestions(tenantId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/market/suggestions/${tenantId}/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get market suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('Get market suggestions error:', error);
      throw error;
    }
  },

  // Calculate with today's rate
  async calculateWithTodayRate(assetId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/calculate/today-rate/${assetId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to calculate with today rate');
      }

      return await response.json();
    } catch (error) {
      console.error('Calculate today rate error:', error);
      throw error;
    }
  },

  // Compare with market
  async compareWithMarket(assetId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/compare/market/${assetId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to compare with market');
      }

      return await response.json();
    } catch (error) {
      console.error('Compare with market error:', error);
      throw error;
    }
  },

  // AI Predictive Analytics
  async getPredictiveAnalytics(assetId, years = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/ai/predict`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assetId, years }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get predictive analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Get predictive analytics error:', error);
      throw error;
    }
  },

  // Compare multiple assets
  async compareAssets(assetIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/ai/compare`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assetIds }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to compare assets');
      }

      return await response.json();
    } catch (error) {
      console.error('Compare assets error:', error);
      throw error;
    }
  },

  // Get asset health report
  async getAssetHealth(assetId) {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/ai/${assetId}/health`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get asset health');
      }

      return await response.json();
    } catch (error) {
      console.error('Get asset health error:', error);
      throw error;
    }
  }
};

export default assetApiService;