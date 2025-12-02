// frontend/src/components/ServiceTest.js
import React, { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const ServiceTest = () => {
  const { settings, loading, error, backendAvailable, updateSettings } = useSettings();

  useEffect(() => {
    console.log('Service Test - Current State:', {
      settings,
      loading,
      error,
      backendAvailable
    });
  }, [settings, loading, error, backendAvailable]);

  const testUpdate = async () => {
    console.log('Testing settings update...');
    const result = await updateSettings('theme', {
      mode: 'dark',
      primaryColor: '#10B981'
    });
    console.log('Update result:', result);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Service Test</h3>
      <p>Backend Available: {backendAvailable ? '✅' : '❌'}</p>
      <p>Error: {error || 'None'}</p>
      <button onClick={testUpdate}>Test Update</button>
      <div style={{ marginTop: '10px' }}>
        <strong>Current Theme:</strong> {settings?.theme?.mode}
      </div>
    </div>
  );
};

export default ServiceTest;