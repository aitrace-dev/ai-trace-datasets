import React, { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Edit2, Maximize2, Loader2 } from 'lucide-react';
import InlineImageLabeler from '@/core/components/InlineImageLabeler';
import ImageFullView from './ImageFullView';
import { ENDPOINTS } from '@/config';

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
  url?: string;
  source_url?: string;
  updated_by_username?: string;
}

interface LabelCreationRequest {
  name: string;
  type: "boolean" | "category";
  description: string;
  possible_values: string[];
}

interface ImageTableProps {
  imageList: DatasetImage[];
  imageNames: Record<string, string>;
  editingNames: Record<string, boolean>;
  imageComments: Record<string, string>;
  imageLabels: Record<string, Record<string, any>>;
  datasetLabelsObject: Record<string, LabelCreationRequest>;
  datasetId: string;
  activeTab: string;
  handleImageNameChange: (imageId: string, newName: string) => void;
  toggleNameEditing: (imageId: string) => void;
  handleLabelsUpdated: (imageId: string, updatedLabels: Record<string, any>) => void;
  handleImageRemoved: (imageId: string) => void;
  handleCommentChange: (imageId: string, comment: string) => void;
  handleSaveImage: (imageId: string) => Promise<void>;
  handleRemoveImage: (imageId: string) => Promise<void>;
  handleQueueImage?: (imageId: string) => Promise<void>;
}

const ImageTable: React.FC<ImageTableProps> = ({
  imageList,
  imageNames,
  editingNames,
  imageComments,
  imageLabels,
  datasetLabelsObject,
  datasetId,
  activeTab,
  handleImageNameChange,
  toggleNameEditing,
  handleLabelsUpdated,
  handleImageRemoved,
  handleCommentChange,
  handleSaveImage,
  handleRemoveImage,
  handleQueueImage
}) => {
  const [selectedImage, setSelectedImage] = useState<{ id: string; name: string; source_url?: string } | null>(null);
  const [savingImages, setSavingImages] = useState<Record<string, boolean>>({});
  const [deletingImages, setDeletingImages] = useState<Record<string, boolean>>({});
  const [queueingImages, setQueueingImages] = useState<Record<string, boolean>>({});
  
  const openImageFullView = (imageId: string, imageName: string) => {
    // Find the image object to get its source_url
    const image = imageList.find(img => img.id === imageId);
    setSelectedImage({ id: imageId, name: imageName, source_url: image?.source_url });
  };
  
  const closeImageFullView = () => {
    setSelectedImage(null);
  };

  const onSaveImage = async (imageId: string) => {
    // Set saving state for this specific image
    setSavingImages(prev => ({ ...prev, [imageId]: true }));
    
    try {
      // Call the save function
      await handleSaveImage(imageId);
    } finally {
      // Clear saving state regardless of success/failure
      setSavingImages(prev => ({ ...prev, [imageId]: false }));
    }
  };

  const onRemoveImage = async (imageId: string) => {
    // Set deleting state for this specific image
    setDeletingImages(prev => ({ ...prev, [imageId]: true }));
    
    try {
      // Call the remove function
      await handleRemoveImage(imageId);
    } finally {
      // Clear deleting state regardless of success/failure
      setDeletingImages(prev => ({ ...prev, [imageId]: false }));
    }
  };

  const onQueueImage = async (imageId: string) => {
    if (!handleQueueImage) return;
    
    // Set queueing state for this specific image
    setQueueingImages(prev => ({ ...prev, [imageId]: true }));
    
    try {
      // Call the queue function
      await handleQueueImage(imageId);
    } finally {
      // Clear queueing state regardless of success/failure
      setQueueingImages(prev => ({ ...prev, [imageId]: false }));
    }
  };
  
  // Determine if we should show the "Set Back to Queue" button
  const shouldShowQueueButton = (image: DatasetImage) => {
    // Only show in "all" or "labeled" tabs and only if the handler is provided
    return (activeTab === 'all' || activeTab === 'labeled') && 
           handleQueueImage !== undefined && 
           !image.is_queued;
  };
  
  if (imageList.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No images available
      </div>
    );
  }
  
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[240px] truncate">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[240px] truncate">Labels</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[240px] truncate">Comments</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[180px] truncate">Last Updated By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {imageList.map(image => (
              <tr key={image.id} className="hover:bg-gray-50">
                {/* Image cell */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="w-24 h-24 flex items-center justify-center relative group">
                    {!image.is_labeled && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-white px-2 py-1 text-xs font-medium z-10">
                        Unlabeled
                      </div>
                    )}
                    <img 
                      src={image.source_url || ENDPOINTS.IMAGE_RENDER(datasetId, image.id)}
                      alt={imageNames[image.id]} 
                      className="max-w-full max-h-full object-contain cursor-pointer" 
                      onClick={() => openImageFullView(image.id, imageNames[image.id])}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => openImageFullView(image.id, imageNames[image.id])}
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Source URL link button */}
                  {image.source_url && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-600 hover:text-blue-800"
                        title="Open original image source URL in new tab"
                      >
                        <a href={image.source_url} target="_blank" rel="noopener noreferrer">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4.5A2.25 2.25 0 0 1 14.25 2.25h7.5A2.25 2.25 0 0 1 24 4.5v7.5A2.25 2.25 0 0 1 21.75 14.25H20M15.75 8.25l-9 9m0 0H8.25m-1.5 0V15.75" />
                          </svg>
                        </a>
                      </Button>
                    </div>
                  )}
                  {/* Image URL link button */}
                  {image.url && (
                    <div className="mt-2 flex justify-center">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1"
                        title="Open image URL in new tab"
                      >
                        <a href={image.url} target="_blank" rel="noopener noreferrer">Open Link</a>
                      </Button>
                    </div>
                  )}
                </td>
                
                {/* Name cell */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {editingNames[image.id] ? (
                      <Input
                        value={imageNames[image.id] || ""}
                        onChange={(e) => handleImageNameChange(image.id, e.target.value)}
                        className="text-sm"
                        onBlur={() => toggleNameEditing(image.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            toggleNameEditing(image.id);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="font-medium text-sm truncate max-w-[200px] inline-block align-middle" title={imageNames[image.id]}>{imageNames[image.id]}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 p-1 h-6 w-6" 
                          onClick={() => toggleNameEditing(image.id)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
                
                {/* Labels cell */}
                <td className="px-4 py-4">
                  <InlineImageLabeler 
                    imageId={image.id}
                    datasetId={datasetId}
                    currentLabels={imageLabels[image.id] || {}}
                    datasetLabels={datasetLabelsObject}
                    onLabelsUpdated={(updatedLabels) => handleLabelsUpdated(image.id, updatedLabels)}
                    onImageRemoved={() => handleImageRemoved(image.id)}
                  />
                </td>
                
                {/* Comments cell */}
                <td className="px-4 py-4">
                  <Textarea 
                    placeholder="Add comments..."
                    className="resize-none min-h-[80px] text-sm w-full max-w-[200px] truncate"
                    value={imageComments[image.id] || ''}
                    onChange={(e) => handleCommentChange(image.id, e.target.value)}
                  />
                </td>
                
                {/* Updated By Username cell */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    {image.updated_by_username || '-'}
                  </div>
                  {image.updated_at && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(image.updated_at).toLocaleString()}
                    </div>
                  )}
                </td>
                
                {/* Actions cell */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm"
                      className="text-xs w-full"
                      onClick={() => onSaveImage(image.id)}
                      disabled={savingImages[image.id]}
                    >
                      {savingImages[image.id] ? (
                        <div className="flex items-center">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          <span>Saving</span>
                        </div>
                      ) : "Save"}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="text-xs w-full"
                      onClick={() => onRemoveImage(image.id)}
                      disabled={deletingImages[image.id]}
                    >
                      {deletingImages[image.id] ? (
                        <div className="flex items-center">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          <span>Deleting</span>
                        </div>
                      ) : "Remove"}
                    </Button>
                    
                    {/* Queue button - only shown in specific tabs and if image is not already queued */}
                    {shouldShowQueueButton(image) && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="text-xs w-full"
                        onClick={() => onQueueImage(image.id)}
                        disabled={queueingImages[image.id]}
                      >
                        {queueingImages[image.id] ? (
                          <div className="flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            <span>Queueing</span>
                          </div>
                        ) : "Set Back to Queue"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {selectedImage && (
        <ImageFullView
          isOpen={!!selectedImage}
          onClose={closeImageFullView}
          imageId={selectedImage.id}
          imageName={selectedImage.name}
          datasetId={datasetId}
          sourceUrl={selectedImage.source_url}
        />
      )}
    </>
  );
};

export default ImageTable;
