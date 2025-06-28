import { API_BASE_URL, ENDPOINTS } from '@/config';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
}

export const getFeatureFlags = async (): Promise<FeatureFlag[]> => {
  const token = localStorage.getItem('ai_trace_token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.FEATURE_FLAGS}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
  }
  
  return response.json();
};

export const updateFeatureFlag = async (flagName: string, enabled: boolean): Promise<FeatureFlag> => {
  const token = localStorage.getItem('ai_trace_token');
  
  if (!token) {
    throw new Error('Authentication token not found');
  }
  
  const response = await fetch(`${API_BASE_URL}${ENDPOINTS.FEATURE_FLAGS}/${flagName}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ enabled }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update feature flag: ${response.statusText}`);
  }
  
  return response.json();
};
