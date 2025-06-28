// Environment variables for the application
// These will be replaced at build time with the actual environment values

// API base URL with fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// API endpoints
export const ENDPOINTS = {
  BASE_API_V1: `${API_BASE_URL}/api/v1`,
  DATASETS: `${API_BASE_URL}/api/v1/datasets`,
  DATASET_SCHEMAS: `${API_BASE_URL}/api/v1/datasets/schemas`,
  AUTH: `${API_BASE_URL}/api/v1/auth`,
  ADMIN_USERS: `${API_BASE_URL}/api/v1/admin/users`,
  KEY_MANAGEMENT: `${API_BASE_URL}/api/v1/key-management`,
  HEALTH: `${API_BASE_URL}/api/v1/health`,
  FEATURE_FLAGS: `/api/v1/feature-flags`,
  IMAGES: (datasetId: string) => `${API_BASE_URL}/api/v1/datasets/${datasetId}/images`,
  DATASET: (id: string) => `${API_BASE_URL}/api/v1/datasets/${id}`,
  IMAGE: (datasetId: string, imageId: string) => `${API_BASE_URL}/api/v1/datasets/${datasetId}/images/${imageId}`,
  IMAGE_RENDER: (datasetId: string, imageId: string) => `${API_BASE_URL}/api/v1/datasets/${datasetId}/images/${imageId}/render`,
  EXPORT: (datasetId: string, onlyLabeled: boolean, format: string) => 
    `${API_BASE_URL}/api/v1/datasets/${datasetId}/export?only_labeled=${onlyLabeled ? 'true' : 'false'}&output_format=${format}`,
  UPLOAD_IMAGE_BY_FILE: (datasetId: string) => `${API_BASE_URL}/api/v1/datasets/${datasetId}/images/upload-by-file`,
  UPLOAD_IMAGE_BY_URL: (datasetId: string) => `${API_BASE_URL}/api/v1/datasets/${datasetId}/images/upload-by-url`,
  DATASET_TESTS: (datasetId: string) => `${API_BASE_URL}/api/v1/datasets/${datasetId}/tests`,
};
