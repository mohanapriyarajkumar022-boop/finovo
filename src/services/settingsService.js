// src/services/settingsService.js

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('sessionToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('userId');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'Tenant-ID': tenantId || '',
    'X-Tenant-ID': tenantId || ''
  };
};

const settingsService = {
  // Get all settings
  async getSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch settings');
      }

      const data = await response.json();
      console.log('✅ Settings fetched from backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      throw error;
    }
  },

  // Update specific section
  async updateSection(section, sectionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/update-section`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          section,
          data: sectionData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update ${section}`);
      }

      const data = await response.json();
      console.log(`✅ Section '${section}' updated in backend:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Error updating section '${section}':`, error);
      throw error;
    }
  },

  // Update all settings
  async updateSettings(settingsData) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(settingsData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const data = await response.json();
      console.log('✅ All settings updated in backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating all settings:', error);
      throw error;
    }
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('✅ Profile updated in backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }
  },

  // Reset settings to default
  async resetSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset settings');
      }

      const data = await response.json();
      console.log('✅ Settings reset in backend:', data);
      return data;
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      const data = await response.json();
      console.log('✅ Password changed successfully');
      return data;
    } catch (error) {
      console.error('❌ Error changing password:', error);
      throw error;
    }
  },

  // Export user data
  async exportData() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/export-data`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export data');
      }

      const data = await response.json();
      console.log('✅ Data exported successfully');
      return data;
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  },

  // Upload profile image
  async uploadProfileImage(imageData) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/upload-profile-image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          imageData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile image');
      }

      const data = await response.json();
      console.log('✅ Profile image uploaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      throw error;
    }
  },

  // Delete account
  async deleteAccount(password) {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/delete-account`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      const data = await response.json();
      console.log('✅ Account deleted successfully');
      return data;
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      throw error;
    }
  }
};

export default settingsService;