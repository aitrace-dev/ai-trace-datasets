import React from 'react';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Textarea } from '@/core/components/ui/textarea';
import LabelConfig from '@/core/components/LabelConfig';

interface LabelCreationRequest {
  name: string;
  type: "boolean" | "category";
  description: string;
  possible_values: string[];
}

interface DatasetSettingsProps {
  name: string;
  description: string;
  isSaving: boolean;
  dataset: {
    labels: LabelCreationRequest[] | null;
  } | null;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSaveDatasetInfo: () => void;
  handleLabelsUpdated: (imageId: string, updatedLabels: Record<string, any>) => void;
}

const DatasetSettings: React.FC<DatasetSettingsProps> = ({
  name,
  description,
  isSaving,
  dataset,
  handleNameChange,
  handleDescriptionChange,
  handleSaveDatasetInfo,
  handleLabelsUpdated
}) => {
  return (
    <div className="space-y-6 py-4">
      <div className="border-b pb-4">
        <h3 className="text-lg font-medium">Dataset Settings</h3>
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="datasetName">Dataset Name</Label>
            <Input 
              id="datasetName" 
              value={name}
              onChange={handleNameChange}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Enter a description for your dataset..."
              value={description}
              onChange={handleDescriptionChange}
              className="h-24"
            />
          </div>
          <Button 
            onClick={handleSaveDatasetInfo}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Dataset Info'}
          </Button>
        </div>
      </div>
      
      <div>
        <LabelConfig 
          existingLabels={dataset?.labels || null}
          datasetName={name}
          datasetDescription={description}
          onLabelsUpdated={handleLabelsUpdated}
        />
      </div>
    </div>
  );
};

export default DatasetSettings;
