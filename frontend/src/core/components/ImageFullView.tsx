import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/core/components/ui/dialog';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

interface ImageFullViewProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  imageName: string;
  datasetId: string;
  sourceUrl?: string;
}

const ImageFullView: React.FC<ImageFullViewProps> = ({
  isOpen,
  onClose,
  imageId,
  imageName,
  datasetId,
  sourceUrl
}) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  // Use source URL if available, otherwise use the render endpoint
  const imageSrc = sourceUrl || (imageId && datasetId ? ENDPOINTS.IMAGE_RENDER(datasetId, imageId) : undefined);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <DialogTitle className="text-lg">{imageName}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRotate}
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetView}
              title="Reset View"
            >
              Reset
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center bg-black/5 h-[80vh] w-full overflow-auto">
          <div 
            className="relative transition-all duration-200 ease-in-out w-full h-full flex items-center justify-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          >
            <img
              src={imageSrc}
              alt={imageName}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageFullView;
