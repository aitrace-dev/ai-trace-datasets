# Image Dataset Management Module

This directory contains components and utilities for managing image datasets within the AI Trace Datasets application.

## Overview
This module provides tools and UI elements for:
- Uploading and organizing image datasets
- Managing dataset metadata and structure
- Integrating image datasets into the AI Trace Datasets workflow

## Main Components
- `DatasetUpload.tsx`: UI for uploading new image datasets
- `DatasetList.tsx`: Displays a list of available image datasets
- `DatasetDetails.tsx`: Shows metadata and images for a selected dataset
- `datasetUtils.ts`: Utility functions for dataset processing and validation
- `api.ts`: API calls related to dataset management

## Usage
1. Use the upload interface to add new image datasets.
2. Browse and select datasets from the list to view details and manage metadata.
3. Integrate datasets into experiments or workflows as needed.

## Configuration
- Ensure the backend API is configured to accept image dataset uploads and metadata updates.
- The frontend uses a centralized config for API endpoints (see `src/config.ts`).

## Notes
- This module is designed for extensibility to support additional dataset types in the future.
- For authentication and access control, refer to the main application documentation.

---
For more information, see the main project README or contact the development team.


```tsx
import { useAuth0 } from '@/ee/auth';

const MyComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (isAuthenticated) {
    return <div>Hello {user.name}</div>;
  }
  
  return <div>Not authenticated</div>;
};
```
