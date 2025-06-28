import { ENDPOINTS } from '@/config';
import DatasetSettings from '@/core/components/DatasetSettings';
import DownloadDatasetModal from '@/core/components/DownloadDatasetModal';
import ImageTable from '@/core/components/ImageTable';
import TestRunsTable, { TestRun } from '@/core/components/TestRunsTable';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/core/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import UploadImagesDialog from '@/core/components/UploadImagesDialog';
import { useToast } from '@/core/hooks/use-toast';
import { authHeaders } from "@/core/utils/auth";
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, Settings, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Match the backend schema for labels
interface LabelCreationRequest {
  name: string;
  type: "boolean" | "category";
  description: string;
  possible_values: string[];
}

interface LabelUpdateRequest {
  name: string;
  value: boolean | string;
}

interface DatasetImage {
  id: string;
  name: string;
  md5: string;
  dataset_id: string;
  labels: Record<string, any> | Array<{name: string, value: any}> | null;
  is_labeled: boolean;
  is_queued: boolean;
  created_at?: string;
  updated_at?: string;
  comment?: string;
  updated_by_username?: string;
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  labels: LabelCreationRequest[] | null;
  n_images: number;
  n_labeled_images: number;
  n_queued_images: number;
  created_at: string;
  updated_at: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

const DatasetView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [images, setImages] = useState<DatasetImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabChanging, setTabChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageComments, setImageComments] = useState<Record<string, string>>({});
  const [imageNames, setImageNames] = useState<Record<string, string>>({});
  const [editingNames, setEditingNames] = useState<Record<string, boolean>>({});
  const [imageLabels, setImageLabels] = useState<Record<string, Record<string, any>>>({});
  const [datasetLabelsObject, setDatasetLabelsObject] = useState<Record<string, LabelCreationRequest>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0
  });
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loadingTestRuns, setLoadingTestRuns] = useState(false);
  const { toast } = useToast();
  
  // Determine active tab based on URL path
  const getActiveTabFromPath = () => {
    if (location.pathname.includes('/labeled')) return 'labeled';
    if (location.pathname.includes('/queued')) return 'queued';
    if (location.pathname.includes('/tests')) return 'tests';
    return 'all';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setTabChanging(true);
    setActiveTab(value);
    
    let newPath = `/dataset/${id}`;
    if (value === 'labeled') {
      newPath = `/dataset/${id}/labeled`;
    } else if (value === 'queued') {
      newPath = `/dataset/${id}/queued`;
    } else if (value === 'tests') {
      newPath = `/dataset/${id}/tests`;
    }
    
    // Reset pagination when changing tabs
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
    
    navigate(newPath);
  };
  
  // Convert labels array to object with name as key
  const convertLabelsArrayToObject = (labelsArray: LabelCreationRequest[] | null): Record<string, LabelCreationRequest> => {
    const labelsObject: Record<string, LabelCreationRequest> = {};
    if (labelsArray && Array.isArray(labelsArray)) {
      labelsArray.forEach((label) => {
        labelsObject[label.name] = {
          name: label.name,
          type: label.type,
          description: label.description,
          possible_values: label.possible_values
        };
      });
    }
    return labelsObject;
  };

  // Function to fetch images with optional filters and pagination
  const fetchImages = async (onlyLabeled: boolean = false, inQueue: boolean = false) => {
    if (!id) return [];
    
    setLoading(true);
    try {
      // Calculate offset based on current page and page size
      const offset = (pagination.currentPage - 1) * pagination.pageSize;
      
      // Build the URL with query parameters
      let url = ENDPOINTS.IMAGES(id);
      const params = new URLSearchParams();
      
      if (onlyLabeled) {
        params.append('is_labeled', 'true');
      }
      
      if (inQueue) {
        // in_queue is the opposite of is_labeled
        params.append('is_labeled', 'false');
      }
      
      // Add search query if provided
      if (debouncedSearchQuery) {
        params.append('search_by_name', debouncedSearchQuery);
      }
      
      // Add pagination parameters
      params.append('limit', pagination.pageSize.toString());
      params.append('offset', offset.toString());
      
      // Add query parameters to URL if any exist
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      console.log(`Fetching images with URL: ${url}`);
      
      // Fetch images with the specified filters and pagination
      const response = await fetch(url, { headers: { ...authHeaders() } });  
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }
      
      // Log all headers for debugging
      console.log('Response headers:');
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      // Extract pagination information from headers
      const totalCount = parseInt(response.headers.get('X-Total-Count') || '0', 10);
      const pageSize = parseInt(response.headers.get('X-Page-Size') || pagination.pageSize.toString(), 10);
      const currentPage = parseInt(response.headers.get('X-Current-Page') || '1', 10);
      const totalPages = parseInt(response.headers.get('X-Total-Pages') || '1', 10);
      
      console.log('Pagination info from server:', {
        totalCount,
        pageSize,
        currentPage,
        totalPages
      });
      
      const imagesData = await response.json();
      console.log(`Received ${imagesData.length} images from server`);
      
      // Update pagination state with values from the server
      setPagination({
        currentPage,
        pageSize,
        totalItems: totalCount,
        totalPages: Math.max(1, totalPages) // Ensure at least 1 page
      });
      
      // Process the fetched images
      processImages(imagesData);
      
      setLoading(false);
      setTimeout(() => setTabChanging(false), 800);
      return imagesData;
    } catch (err) {
      console.error('Error fetching images:', err);
      setLoading(false);
      setTimeout(() => setTabChanging(false), 800);
      return [];
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    console.log(`Changing page from ${pagination.currentPage} to ${newPage}`);
    
    // Update pagination state
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
    
    // Scroll to top of the page for better UX
    window.scrollTo(0, 0);
  };

  // Render improved pagination controls with page numbers and ellipsis
  const renderPagination = () => {
    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1) return null;

    // Helper to build page number array with ellipsis
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5; // Show up to 5 page numbers
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (end - start < maxVisible - 1) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxVisible - 1);
        } else if (end === totalPages) {
          start = Math.max(1, end - maxVisible + 1);
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return { pages, start, end };
    };

    const { pages, start, end } = getPageNumbers();

    return (
      <div className="flex items-center justify-center space-x-2 mt-6 mb-4 py-4 border-t border-b bg-gray-50 rounded-md">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading}
          aria-label="First page"
        >
          «
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 1 && (
          <span className="px-1 text-gray-400">...</span>
        )}
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className={page === currentPage ? "font-bold border-primary" : ""}
            onClick={() => handlePageChange(page)}
            disabled={loading}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        ))}
        {end < totalPages && (
          <span className="px-1 text-gray-400">...</span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          aria-label="Last page"
        >
          »
        </Button>
        <div className="text-xs text-muted-foreground ml-4">
          Page {currentPage} of {totalPages} ({pagination.totalItems} items)
        </div>
      </div>
    );
  };

  // Process images and update state
  const processImages = (imagesData: DatasetImage[]) => {
    // Initialize comments, names, and labels for each image
    const commentsObj = { ...imageComments };
    const namesObj = { ...imageNames };
    const editingObj = { ...editingNames };
    const labelsObj = { ...imageLabels };
    
    imagesData.forEach((img: DatasetImage) => {
      commentsObj[img.id] = img.comment || '';
      namesObj[img.id] = img.name || '';
      editingObj[img.id] = false;
      
      // Convert array labels to object if needed
      const labelValues: Record<string, any> = {};
      if (img.labels) {
        if (Array.isArray(img.labels)) {
          img.labels.forEach(label => {
            if (label && typeof label === 'object' && 'name' in label && 'value' in label) {
              labelValues[label.name] = label.value;
            }
          });
        } else {
          Object.entries(img.labels).forEach(([key, value]) => {
            labelValues[key] = value;
          });
        }
      }
      labelsObj[img.id] = labelValues;
    });
    
    setImageComments(commentsObj);
    setImageNames(namesObj);
    setEditingNames(editingObj);
    setImageLabels(labelsObj);
    
    setImages(imagesData);
  };
  
  // Fetch dataset info
  const fetchDataset = async () => {
    if (!id) return;
    
    try {
      // Fetch dataset details
      const datasetResponse = await fetch(ENDPOINTS.DATASET(id), { headers: authHeaders() });
      if (!datasetResponse.ok) {
        throw new Error(`Failed to fetch dataset: ${datasetResponse.statusText}`);
      }
      const datasetData = await datasetResponse.json();
      
      // Convert labels array to object with name as key
      const labelsObject = convertLabelsArrayToObject(datasetData.labels);
      setDatasetLabelsObject(labelsObject);
      
      setDataset(datasetData);
      setName(datasetData.name);
      setDescription(datasetData.description || '');
    } catch (err) {
      console.error('Error fetching dataset:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  // Fetch test runs for the dataset
  const fetchTestRuns = async () => {
    if (!id) return;
    
    setLoadingTestRuns(true);
    try {
      const response = await fetch(ENDPOINTS.DATASET_TESTS(id), { headers: authHeaders() });
      if (!response.ok) {
        throw new Error(`Failed to fetch test runs: ${response.statusText}`);
      }
      
      const testRunsData = await response.json();
      setTestRuns(testRunsData);
    } catch (err) {
      console.error('Error fetching test runs:', err);
      toast({
        title: "Error fetching test runs",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingTestRuns(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (id) {
      const loadInitialData = async () => {
        setLoading(true);
        await fetchDataset();
        
        // Load images based on the current URL path
        const currentTab = getActiveTabFromPath();
        if (currentTab === 'all') {
          await fetchImages(false, false);
        } else if (currentTab === 'labeled') {
          await fetchImages(true, false);
        } else if (currentTab === 'queued') {
          await fetchImages(false, true);
        }
        
        setLoading(false);
      };
      
      loadInitialData();
    }
  }, [id]);
  
  // Update active tab when URL changes
  useEffect(() => {
    const newActiveTab = getActiveTabFromPath();
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  }, [location.pathname]);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination when search query changes
  useEffect(() => {
    if (dataset) {
      setPagination(prev => ({
        ...prev,
        currentPage: 1
      }));
    }
  }, [debouncedSearchQuery]);

  // Fetch images when tab or pagination changes
  useEffect(() => {
    if (dataset) {
      if (activeTab === 'labeled') {
        fetchImages(true, false);
      } else if (activeTab === 'queued') {
        fetchImages(false, true);
      } else {
        fetchImages(false, false);
      }
    }
  }, [activeTab, pagination.currentPage, pagination.pageSize, dataset, debouncedSearchQuery]);

  // Fetch test runs when the dataset is loaded
  useEffect(() => {
    if (dataset) {
      fetchTestRuns();
    }
  }, [dataset]);

  const handleImagesUploaded = (newImages: DatasetImage[]) => {
    // Add new images to images list
    setImages(prev => [...prev, ...newImages]);
    
    // Initialize comments, names, and labels for new images
    const newCommentsObj = { ...imageComments };
    const newNamesObj = { ...imageNames };
    const newEditingObj = { ...editingNames };
    const newLabelsObj = { ...imageLabels };
    
    newImages.forEach(img => {
      newCommentsObj[img.id] = '';
      newNamesObj[img.id] = img.name || '';
      newEditingObj[img.id] = false;
      newLabelsObj[img.id] = {};
    });
    
    setImageComments(newCommentsObj);
    setImageNames(newNamesObj);
    setEditingNames(newEditingObj);
    setImageLabels(newLabelsObj);
    
    // Refresh dataset info to get updated counts
    if (id) {
      fetchDataset();
      
      // Reload images for the current tab
      if (activeTab === 'all') {
        fetchImages(false, false);
      } else if (activeTab === 'labeled') {
        fetchImages(true, false);
      } else if (activeTab === 'queued') {
        fetchImages(false, true);
      }
    }
  };

  // Handle dataset updated
  const handleDatasetUpdated = (updatedDataset: Dataset) => {
    setDataset(updatedDataset);
    setName(updatedDataset.name);
    setDescription(updatedDataset.description);
    
    // Update dataset labels object
    if (updatedDataset.labels) {
      setDatasetLabelsObject(convertLabelsArrayToObject(updatedDataset.labels));
    }
    
    toast({
      title: "Dataset updated",
      description: "The dataset information has been updated successfully.",
    });
  };
  
  const handleSaveDatasetInfo = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      // Convert labels object back to array for API
      const labelsArray = dataset?.labels ? 
        (Array.isArray(dataset.labels) ? 
          dataset.labels : 
          Object.values(dataset.labels)
        ) : [];
      
      const response = await fetch(ENDPOINTS.DATASET(id), {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          labels: labelsArray
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update dataset: ${response.statusText}`);
      }
      
      const updatedDataset = await response.json();
      
      // Convert labels array to object
      const labelsObject = convertLabelsArrayToObject(updatedDataset.labels);
      setDatasetLabelsObject(labelsObject);
      
      setDataset(updatedDataset);
      
      toast({
        title: "Dataset updated",
        description: "The dataset information has been saved successfully.",
      });
    } catch (err) {
      console.error('Error updating dataset:', err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };
  
  const handleCommentChange = (imageId: string, comment: string) => {
    setImageComments(prev => ({
      ...prev,
      [imageId]: comment
    }));
  };
  
  const handleImageNameChange = (imageId: string, newName: string) => {
    setImageNames(prev => ({
      ...prev,
      [imageId]: newName
    }));
  };
  
  const toggleNameEditing = (imageId: string) => {
    setEditingNames(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };
  
  const handleLabelsUpdated = (imageId: string, updatedLabels: Record<string, any>) => {
    // Update the labels for this specific image
    setImageLabels(prev => ({
      ...prev,
      [imageId]: updatedLabels
    }));
  };
  
  // Function to handle image removal
  const handleImageRemoved = (imageId: string) => {
    // Update the UI by removing the image from the list
    setImages(prev => prev.filter(img => img.id !== imageId));
    
    // Remove the comment, name, and labels for this image
    const newComments = { ...imageComments };
    const newNames = { ...imageNames };
    const newEditing = { ...editingNames };
    const newLabels = { ...imageLabels };
    
    delete newComments[imageId];
    delete newNames[imageId];
    delete newEditing[imageId];
    delete newLabels[imageId];
    
    setImageComments(newComments);
    setImageNames(newNames);
    setEditingNames(newEditing);
    setImageLabels(newLabels);
    
    // Refresh dataset info to get updated counts
    if (id) {
      fetchDataset();
    }
  };

  // Handle saving labels, comments, and name
  const handleSaveImage = async (imageId: string) => {
    if (!id) return;

    try {
      // Always send all labels from datasetLabelsObject, using imageLabels or default
      const labelUpdates = Object.entries(datasetLabelsObject ?? {}).map(([name, def]) => {
        let value = imageLabels[imageId]?.[name];
        if (value === undefined || value === null) {
          if (def.type === 'boolean') value = false;
          else if (def.type === 'category' && def.possible_values.length > 0) value = def.possible_values[0];
          else value = '';
        }
        return { name, value };
      });

      // Find the current image to check if it's in the queue
      const currentImage = images.find(img => img.id === imageId);
      
      // Prepare the update request
      const updateData: {
        name: string;
        comment: string;
        labels: { name: string; value: any }[];
        is_labeled?: boolean;
      } = {
        name: imageNames[imageId],
        comment: imageComments[imageId],
        labels: labelUpdates
      };
      
      // Only set is_labeled=true if the image is currently in the queue (not labeled)
      if (currentImage && !currentImage.is_labeled) {
        updateData.is_labeled = true;
      }

      console.log('Saving image with data:', updateData);

      // Make the API call to update the image
      const response = await fetch(ENDPOINTS.IMAGE(id, imageId), {
        method: 'PUT',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update image: ${response.statusText}`);
      }

      // Get the updated image data
      const updatedImage = await response.json();
      
      // Update the local state for this specific image
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, ...updatedImage } : img
      ));

      toast({
        title: "Image updated",
        description: "Image has been updated successfully.",
      });
    } catch (err) {
      console.error('Error updating image:', err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Handle removing image
  const handleRemoveImage = async (imageId: string) => {
    if (!id) return;
    
    try {
      // Make the API call to delete the image
      const response = await fetch(ENDPOINTS.IMAGE(id, imageId), { 
        method: 'DELETE', 
        headers: authHeaders(), 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.statusText}`);
      }
      
      // Remove the image from the local state
      handleImageRemoved(imageId);
      
      toast({
        title: "Image removed",
        description: "Image has been removed from the dataset.",
      });
    } catch (err) {
      console.error('Error removing image:', err);
      toast({
        title: "Removal failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle putting image back into queue
  const handleQueueImage = async (imageId: string) => {
    if (!id) return;
    
    try {
      // Make the API call to queue the image
      const response = await fetch(ENDPOINTS.IMAGE(id, imageId), { 
        method: 'PUT', 
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({ is_labeled: false })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to queue image: ${response.statusText}`);
      }
      
      // Get the updated image data
      const updatedImage = await response.json();
      
      // Update the local state for this specific image
      setImages(prev => {
        // If we're in the labeled tab, remove the image from the list
        if (activeTab === 'labeled') {
          return prev.filter(img => img.id !== imageId);
        }
        
        // Otherwise, update the image in the list
        return prev.map(img => 
          img.id === imageId ? { ...img, ...updatedImage } : img
        );
      });
      
      toast({
        title: "Image queued",
        description: "Image has been added back to the queue.",
      });
    } catch (err) {
      console.error('Error queueing image:', err);
      toast({
        title: "Queue operation failed",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header with dataset info and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{dataset?.name || 'Loading...'}</h1>
          <p className="text-gray-500 mt-1">{dataset?.description || ''}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-blue-50">
              {dataset?.n_images || 0} Images
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {dataset?.n_labeled_images || 0} Labeled
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Images
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setShowDownloadModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            Download
          </Button>
          <UploadImagesDialog
            isOpen={isUploadDialogOpen}
            onClose={() => setIsUploadDialogOpen(false)}
            onImagesUploaded={handleImagesUploaded}
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Dataset Settings</SheetTitle>
              </SheetHeader>
              {dataset && (
                <DatasetSettings
                  name={name}
                  description={description}
                  isSaving={isSaving}
                  dataset={dataset}
                  handleNameChange={handleNameChange}
                  handleDescriptionChange={handleDescriptionChange}
                  handleSaveDatasetInfo={handleSaveDatasetInfo}
                  handleLabelsUpdated={handleLabelsUpdated}
                />
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <DownloadDatasetModal
        open={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        datasetId={id || ''}
      />
      
      {/* Search input */}
      <div className="mb-4 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images by name..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1.5 h-6 w-6 rounded-full p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Tabs for filtering images */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Images {dataset && `(${dataset.n_images})`}</TabsTrigger>
          <TabsTrigger value="labeled">Labeled {dataset && `(${dataset.n_labeled_images})`}</TabsTrigger>
          <TabsTrigger value="queued">In Queue {dataset && `(${dataset.n_queued_images})`}</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {loading || tabChanging ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : images.length > 0 ? (
            <>
              <ImageTable
                imageList={images}
                imageNames={imageNames}
                editingNames={editingNames}
                imageComments={imageComments}
                imageLabels={imageLabels}
                datasetLabelsObject={datasetLabelsObject}
                datasetId={id || ''}
                activeTab={activeTab}
                handleImageNameChange={handleImageNameChange}
                toggleNameEditing={toggleNameEditing}
                handleLabelsUpdated={handleLabelsUpdated}
                handleImageRemoved={handleImageRemoved}
                handleCommentChange={handleCommentChange}
                handleSaveImage={handleSaveImage}
                handleRemoveImage={handleRemoveImage}
                handleQueueImage={handleQueueImage}
              />
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No images found. Upload some images to get started.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="labeled" className="mt-6">
          {loading || tabChanging ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : images.length > 0 ? (
            <>
              <ImageTable
                imageList={images}
                imageNames={imageNames}
                editingNames={editingNames}
                imageComments={imageComments}
                imageLabels={imageLabels}
                datasetLabelsObject={datasetLabelsObject}
                datasetId={id || ''}
                activeTab={activeTab}
                handleImageNameChange={handleImageNameChange}
                toggleNameEditing={toggleNameEditing}
                handleLabelsUpdated={handleLabelsUpdated}
                handleImageRemoved={handleImageRemoved}
                handleCommentChange={handleCommentChange}
                handleSaveImage={handleSaveImage}
                handleRemoveImage={handleRemoveImage}
                handleQueueImage={handleQueueImage}
              />
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No labeled images found. Label some images to see them here.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="queued" className="mt-6">
          {loading || tabChanging ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : images.length > 0 ? (
            <>
              <ImageTable
                imageList={images}
                imageNames={imageNames}
                editingNames={editingNames}
                imageComments={imageComments}
                imageLabels={imageLabels}
                datasetLabelsObject={datasetLabelsObject}
                datasetId={id || ''}
                activeTab={activeTab}
                handleImageNameChange={handleImageNameChange}
                toggleNameEditing={toggleNameEditing}
                handleLabelsUpdated={handleLabelsUpdated}
                handleImageRemoved={handleImageRemoved}
                handleCommentChange={handleCommentChange}
                handleSaveImage={handleSaveImage}
                handleRemoveImage={handleRemoveImage}
                // Don't pass handleQueueImage to the queued tab
              />
              {renderPagination()}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No images in queue. Add images to the queue to see them here.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="tests" className="mt-6">
          <TestRunsTable testRuns={testRuns} loading={loadingTestRuns} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatasetView;
