// frontend/src/services/settingsService.js
const API_BASE_URL = 'http://localhost:5000';

class SettingsService {
  getAuthHeaders() {
    const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (tenantId) {
      headers['Tenant-ID'] = tenantId;
    }
    
    return headers;
  }

  async getSettings() {
    try {
      console.log('🔍 Fetching settings from:', `${API_BASE_URL}/api/settings`);
      
      const headers = this.getAuthHeaders();
      console.log('📤 Request headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'GET',
        headers: headers
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Settings fetched successfully:', data);
      
      return {
        success: true,
        data: data.settings || data
      };
    } catch (error) {
      console.error('❌ Failed to fetch settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateSection(section, sectionData) {
    try {
      console.log('🔄 Updating section:', section, 'Data:', sectionData);
      
      const headers = this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/settings/update-section`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
          section: section,
          settings: sectionData
        })
      });

      console.log('📥 Update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Update error:', errorText);
        throw new Error(`Failed to update section: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Section updated successfully:', data);
      
      return {
        success: true,
        data: data.settings || data
      };
    } catch (error) {
      console.error('❌ Failed to update section:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async resetSettings(tenantId) {
    try {
      console.log('🔄 Resetting settings for tenantId:', tenantId);
      
      const headers = this.getAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/settings/reset`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ tenantId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Reset error:', errorText);
        throw new Error(`Failed to reset settings: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Settings reset successfully:', data);
      
      return {
        success: true,
        data: data.settings || data
      };
    } catch (error) {
      console.error('❌ Failed to reset settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new SettingsService();