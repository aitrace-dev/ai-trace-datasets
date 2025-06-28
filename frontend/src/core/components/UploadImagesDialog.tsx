import React, { useState, useCallback, useEffect } from 'react';
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { useToast } from "@/core/hooks/use-toast";
import { Image, Link, Plus, Tag, Loader2, X, RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import { useParams } from 'react-router-dom';
import BulkImportDialog from './BulkImportDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/core/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS, API_BASE_URL } from '@/config';

interface DatasetImage {
  id: string;
  name: string;
  md5: string;
  dataset_id: string;
  labels: any | null;
  is_labeled: boolean;
  is_queued: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UploadImagesDialogProps {
  onImagesUploaded: (images: DatasetImage[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const UploadImagesDialog = ({ onImagesUploaded, isOpen, onClose }: UploadImagesDialogProps) => {
  const { id: datasetId } = useParams<{ id: string }>();
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<{ url: string; file?: File } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('url');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const { toast } = useToast();

  // --- Dataset label logic ---
  const [datasetLabels, setDatasetLabels] = useState<Record<string, {name: string; type: string; possible_values: string[];}>>({});
  const [labelSelections, setLabelSelections] = useState<Record<string, string | boolean>>({});
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  useEffect(() => {
    if (isOpen && datasetId) {
      fetchDatasetLabels();
    }
  }, [isOpen, datasetId]);

  const fetchDatasetLabels = async () => {
    setIsLoadingLabels(true);
    try {
      const response = await fetch(ENDPOINTS.DATASET(datasetId), { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch dataset labels');
      const dataset = await response.json();
      if (dataset.labels && Array.isArray(dataset.labels)) {
        const labelsObj: Record<string, {name: string; type: string; possible_values: string[]}> = {};
        dataset.labels.forEach((lbl: any) => {
          labelsObj[lbl.name] = lbl;
        });
        setDatasetLabels(labelsObj);
        // Default selection: first value for each label
        const defaults: Record<string, string | boolean> = {};
        dataset.labels.forEach((lbl: any) => {
          if (lbl.possible_values && lbl.possible_values.length > 0) {
            defaults[lbl.name] = lbl.possible_values[0];
          } else if (lbl.type === 'boolean') {
            defaults[lbl.name] = false;
          }
        });
        setLabelSelections(defaults);
      }
    } catch (e) {
      setDatasetLabels({});
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.type.startsWith('image/')) {
      // Revoke previous object URL to prevent memory leaks
      if (previewImage?.url && previewImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage.url);
      }
      
      setPreviewImage({
        url: URL.createObjectURL(file),
        file: file
      });
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an image file.",
        variant: "destructive",
      });
    }
  };

  // Function to download image from URL and convert to File object
  const downloadImageFromUrl = async (url: string) => {
    if (!url.trim()) return;
    
    setIsDownloading(true);
    
    try {
      // Fetch the image from the URL
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      
      // Check if the content is an image
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('The URL does not point to a valid image');
      }
      
      // Get the image data as blob
      const blob = await response.blob();
      
      // Extract filename from URL or use a default name
      let filename = 'image';
      try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment.includes('.')) {
          filename = lastSegment;
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
      }
      
      // Create a File object from the blob
      const file = new File([blob], filename, { type: contentType });
      
      // Revoke previous object URL to prevent memory leaks
      if (previewImage?.url && previewImage.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage.url);
      }
      
      // Set the preview with the downloaded image
      setPreviewImage({
        url: URL.createObjectURL(blob),
        file: file
      });
      
      toast({
        title: "Image downloaded",
        description: "The image has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download image from URL",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setImageUrl('');
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    
    downloadImageFromUrl(imageUrl);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const clearPreviewImage = () => {
    // Revoke object URL to prevent memory leaks
    if (previewImage?.url && previewImage.url.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage.url);
    }
    setPreviewImage(null);
  };

  const uploadImageToApi = useCallback(async (file: File, queueImage: boolean = true, withLabels: boolean = false): Promise<DatasetImage | null> => {
    if (!datasetId) {
      toast({
        title: "Error",
        description: "Dataset ID is missing.",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (imageUrl && imageUrl.trim()) {
        formData.append('url', imageUrl.trim());
      }
      
      // Add name if available
      if (imageName) {
        formData.append('name', imageName);
      }
      
      // Add labels if requested
      if (withLabels && Object.keys(labelSelections).length > 0) {
        const labelData = Object.entries(datasetLabels).map(([label, def]) => ({
          name: label,
          value: labelSelections[label],
        }));
        formData.append('labels', JSON.stringify(labelData));
        formData.append('is_labeled', 'true');
      }

      const response = await fetch(ENDPOINTS.UPLOAD_IMAGE_BY_FILE(datasetId), {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      if (response.status === 409) {
        toast({
          title: "Image already exists",
          description: "This image has already been uploaded to the dataset.",
          variant: "destructive",
        });
        return null;
      }

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const imageData: DatasetImage = await response.json();
      
      // If we need to update the queue status
      if (queueImage !== imageData.is_queued) {
        // TODO: Implement API call to update queue status if needed
      }

      return imageData;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [datasetId, toast, imageUrl]);


  const closeBulkImport = () => {
    setIsBulkImportOpen(false);
  };

  const handleBulkImagesUploaded = (images: DatasetImage[]) => {
    if (images.length > 0) {
      onImagesUploaded(images);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setPreviewImage(null);
    setImageLoaded(false);
    setAddError(null);
  };

  const handlePreviewFromUrl = async () => {
    if (!imageUrl.trim()) return;
    setIsDownloading(true);
    try {
      // Use the proxy endpoint to avoid CORS issues
      const encodedUrl = encodeURIComponent(imageUrl);
      // Use API_BASE_URL from config to ensure correct endpoint
      const proxyUrl = `${API_BASE_URL}/api/v1/images-preview?url=${encodedUrl}`;
      const response = await fetch(proxyUrl, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      // Extract filename from URL or fallback
      let filename = 'image.jpg';
      try {
        const urlObj = new URL(imageUrl);
        const pathSegments = urlObj.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && lastSegment.includes('.')) {
          filename = lastSegment;
        }
      } catch {}
      // Create a File from the blob for upload
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      setPreviewImage({ url: URL.createObjectURL(blob), file });
      setImageLoaded(true);
    } catch (e) {
      toast({ title: 'Invalid Image', description: 'Could not load image from URL', variant: 'destructive' });
      setImageLoaded(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const getEffectiveLabelSelections = () => {
    const effective: Record<string, string | boolean> = { ...labelSelections };
    Object.entries(datasetLabels).forEach(([label, def]) => {
      if (def.type === 'boolean' && effective[label] == null) {
        effective[label] = false;
      }
    });
    return effective;
  };

  const handleAddToDataset = async () => {
    const effectiveSelections = getEffectiveLabelSelections();
    // Require all non-boolean labels to be selected
    const missing = Object.entries(datasetLabels).filter(([label, def]) =>
      def.type !== 'boolean' && !effectiveSelections[label]
    );
    if (missing.length > 0) {
      setAddError("Please select a value for all labels before uploading.");
      return;
    }
    if (!previewImage?.file || !datasetId) return;
    setAddLoading(true);
    setAddError(null);
    try {
      // Upload the image with labels in a single request
      const formData = new FormData();
      formData.append('file', previewImage.file);
      if (imageUrl && imageUrl.trim()) {
        formData.append('url', imageUrl.trim());
      }
      formData.append('name', imageName);
      
      // Add labels directly to the upload request
      const labelData = Object.entries(datasetLabels).map(([label, def]) => ({
        name: label,
        value: effectiveSelections[label],
      }));
      formData.append('labels', JSON.stringify(labelData));
      formData.append('is_labeled', 'true');
      
      const response = await fetch(ENDPOINTS.UPLOAD_IMAGE_BY_FILE(datasetId), {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      
      if (response.status === 409) {
        setAddError('Image already exists in this dataset.');
        return;
      }
      if (!response.ok) throw new Error('Failed to add image to dataset');
      const labeledImage = await response.json();
      toast({ title: 'Image Added', description: 'Image has been added to the dataset and labeled.' });
      setPreviewImage(null);
      setImageLoaded(false);
      setImageUrl('');
      setImageName("");
      setLabelSelections({});
      onImagesUploaded && onImagesUploaded([labeledImage]);
    } catch (e: any) {
      setAddError(e.message || 'Failed to add image to dataset');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Images</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="url">Add URL</TabsTrigger>
            <TabsTrigger value="upload">Drag & Drop</TabsTrigger>
            <TabsTrigger value="csv">Bulk CSV</TabsTrigger>
          </TabsList>
          {/* Add by URL */}
          <TabsContent value="url">
            <div className="space-y-4">
              <div className="flex gap-2 items-center">
                <Input value={imageUrl} onChange={handleUrlChange} placeholder="Paste image URL here..." />
                <Button onClick={handlePreviewFromUrl} disabled={isDownloading || !imageUrl.trim()}>
                  {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Preview'}
                </Button>
              </div>
              {/* Preview loaded image and Add to Dataset button */}
              {previewImage?.url && imageLoaded && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <img src={previewImage.url} alt="Preview" className="max-h-64 rounded border" />
                  <Input
                    value={imageName}
                    onChange={e => setImageName(e.target.value)}
                    placeholder="Enter image name (optional)"
                    className="mt-2 max-w-xs"
                  />
                  {/* Label selection for each dataset label */}
                  {Object.keys(datasetLabels).length > 0 && (
                    <div className="w-full flex flex-col gap-2 mt-2">
                      {Object.entries(datasetLabels).map(([label, def]) => (
                        <div key={label} className="flex flex-col gap-1">
                          <label className="text-sm font-medium">{label}</label>
                          {def.type === 'boolean' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={labelSelections[label] === true}
                                onChange={e => setLabelSelections(sel => ({ ...sel, [label]: e.target.checked }))}
                                className="h-4 w-4"
                              />
                              <span>{labelSelections[label] === true ? 'True' : 'False'}</span>
                            </div>
                          ) : (
                            <select
                              value={typeof labelSelections[label] === 'boolean' ? String(labelSelections[label]) : (labelSelections[label] as string || "")}
                              onChange={e => setLabelSelections(sel => ({ ...sel, [label]: e.target.value }))}
                              className="border rounded p-2"
                            >
                              <option value="" disabled>Select value</option>
                              {def.possible_values.map((v: string) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button onClick={handleAddToDataset} disabled={addLoading} className="mt-2">
                    {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add to Dataset'}
                  </Button>
                  {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
                </div>
              )}
            </div>
          </TabsContent>
          {/* Drag & Drop */}
          <TabsContent value="upload">
            {previewImage ? (
              <div className="flex flex-col items-center gap-4">
                <img src={previewImage.url} alt="Preview" className="max-h-48 rounded shadow" />
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setPreviewImage(null)} disabled={isUploading || isDownloading}>
                    <X className="h-4 w-4" />
                  </Button>
                  <label>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full opacity-90 hover:opacity-100 cursor-pointer" disabled={isUploading || isDownloading} asChild>
                      <div>
                        <RefreshCw className="h-4 w-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} disabled={isUploading || isDownloading} />
                      </div>
                    </Button>
                  </label>
                </div>
                
                {/* Image name input */}
                <Input
                  value={imageName}
                  onChange={e => setImageName(e.target.value)}
                  placeholder="Enter image name (optional)"
                  className="mt-2 max-w-xs"
                />
                
                {/* Label selection for each dataset label */}
                {Object.keys(datasetLabels).length > 0 && (
                  <div className="w-full flex flex-col gap-2 mt-2">
                    {Object.entries(datasetLabels).map(([label, def]) => (
                      <div key={label} className="flex flex-col gap-1">
                        <label className="text-sm font-medium">{label}</label>
                        {def.type === 'boolean' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={labelSelections[label] === true}
                              onChange={e => setLabelSelections(sel => ({ ...sel, [label]: e.target.checked }))}
                              className="h-4 w-4"
                            />
                            <span>{labelSelections[label] === true ? 'True' : 'False'}</span>
                          </div>
                        ) : (
                          <select
                            value={typeof labelSelections[label] === 'boolean' ? String(labelSelections[label]) : (labelSelections[label] as string || "")}
                            onChange={e => setLabelSelections(sel => ({ ...sel, [label]: e.target.value }))}
                            className="border rounded p-2"
                          >
                            <option value="" disabled>Select value</option>
                            {def.possible_values.map((v: string) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
                
                <div className="flex flex-col gap-2 mt-2 w-full">
                  <Button onClick={handleAddToDataset} disabled={addLoading} className="flex items-center justify-center w-full">
                    {addLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Add to Dataset'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`border-2 ${isDragging ? 'border-primary bg-primary/10' : 'border-dashed'} rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label className="block cursor-pointer">
                  <Image className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">{isDragging ? 'Drop your images here' : 'Drag and drop your images here'}</p>
                  <p className="text-xs text-muted-foreground">or <span className="text-primary underline">click to browse</span></p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileInputChange} />
                </label>
              </div>
            )}
          </TabsContent>
          {/* Bulk CSV Import */}
          <TabsContent value="csv">
            <div className="flex flex-col items-center gap-4 py-8">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Import many images at once using a CSV file (with URLs or file info).</p>
              <Button onClick={() => setIsBulkImportOpen(true)} variant="default">
                <Download className="mr-2" /> Bulk Import CSV
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        {/* Bulk Import Dialog */}
        {isBulkImportOpen && datasetId && (
          <BulkImportDialog
            isOpen={isBulkImportOpen}
            onClose={closeBulkImport}
            datasetId={datasetId}
            onImagesUploaded={handleBulkImagesUploaded}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadImagesDialog;
