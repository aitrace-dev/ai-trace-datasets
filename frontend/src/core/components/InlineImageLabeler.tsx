import React, { useState, useEffect } from 'react';
import { Button } from "@/core/components/ui/button";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Loader2, Check, Trash } from "lucide-react";
import { useToast } from "@/core/hooks/use-toast";
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

// Match the backend schema
interface LabelDefinition {
  name: string;
  type: "boolean" | "category";
  description: string;
  possible_values: string[];
}

interface LabelUpdateRequest {
  name: string;
  value: boolean | string;
}

interface InlineImageLabelerProps {
  imageId: string;
  datasetId: string;
  currentLabels: Record<string, any> | null;
  datasetLabels: Record<string, LabelDefinition> | null;
  onLabelsUpdated: (labels: Record<string, any>) => void;
  onImageRemoved?: () => void;
}

const InlineImageLabeler = ({ 
  imageId, 
  datasetId, 
  currentLabels, 
  datasetLabels, 
  onLabelsUpdated,
  onImageRemoved
}: InlineImageLabelerProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labelValues, setLabelValues] = useState<Record<string, boolean | string>>({});
  const { toast } = useToast();
  
  // Initialize form with default values
  useEffect(() => {
    if (!datasetLabels) return;
    
    const initialValues: Record<string, boolean | string> = {};
    
    // First try to use current values if they exist
    if (currentLabels) {
      // Handle both array and object formats for labels
      if (Array.isArray(currentLabels)) {
        // If labels are in array format
        currentLabels.forEach((label) => {
          if (label && typeof label === 'object' && 'name' in label && 'value' in label) {
            initialValues[label.name] = label.value;
          }
        });
      } else {
        // If labels are in object format
        Object.entries(currentLabels).forEach(([key, value]) => {
          initialValues[key] = value;
        });
      }
    }
    
    // Add any missing labels with default values
    Object.entries(datasetLabels).forEach(([name, def]) => {
      if (initialValues[name] === undefined) {
        if (def.type === 'boolean') {
          // Always default boolean values to false
          initialValues[name] = false;
        } else if (def.possible_values.length > 0) {
          // Use the first possible value as default
          initialValues[name] = def.possible_values[0];
        } else {
          initialValues[name] = '';
        }
      }
    });
    
    console.log('Initial label values:', initialValues);
    setLabelValues(initialValues);
  }, [currentLabels, datasetLabels]);
  
  const handleSave = async () => {
    if (!datasetId || !imageId) {
      toast({
        title: "Error",
        description: "Missing dataset or image ID",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Always send all labels from datasetLabels, using labelValues or default
      const labelUpdates: LabelUpdateRequest[] = Object.entries(datasetLabels ?? {}).map(([name, def]) => {
        let value = labelValues[name];
        if (value === undefined || value === null) {
          if (def.type === 'boolean') value = false;
          else if (def.type === 'category' && def.possible_values.length > 0) value = def.possible_values[0];
          else value = '';
        }
        return { name, value };
      });
      const response = await fetch(ENDPOINTS.IMAGE(datasetId, imageId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(labelUpdates),
      });
      if (!response.ok) {
        throw new Error(`Failed to update labels: ${response.statusText}`);
      }
      toast({
        title: "Labels updated",
        description: "Image labels have been updated successfully.",
      });
      // Update the parent with the completed values
      const completedLabelValues: Record<string, boolean | string> = {};
      labelUpdates.forEach(l => { completedLabelValues[l.name] = l.value; });
      onLabelsUpdated(completedLabelValues);
    } catch (error) {
      console.error('Error updating labels:', error);
      toast({
        title: "Failed to update labels",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemove = () => {
    // Here you would implement the logic to remove the image
    // For now, we'll just update the UI
    toast({
      title: "Image removed",
      description: "Image has been removed from the dataset",
    });
    
    if (onImageRemoved) {
      onImageRemoved();
    }
  };
  
  const handleBooleanChange = (name: string, checked: boolean) => {
    const updatedValues = {
      ...labelValues,
      [name]: checked
    };
    setLabelValues(updatedValues);
    onLabelsUpdated(updatedValues);
  };
  
  const handleCategoryChange = (name: string, value: string) => {
    const updatedValues = {
      ...labelValues,
      [name]: value
    };
    setLabelValues(updatedValues);
    onLabelsUpdated(updatedValues);
  };
  
  if (!datasetLabels || Object.keys(datasetLabels).length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No labels created for this dataset
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {Object.entries(datasetLabels).map(([name, definition]) => {
        if (definition.type === 'boolean') {
          return (
            <div key={name} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
              <Checkbox
                id={`${imageId}-${name}`}
                checked={!!labelValues[name]}
                onCheckedChange={(checked) => handleBooleanChange(name, !!checked)}
                disabled={isSubmitting}
              />
              <label 
                htmlFor={`${imageId}-${name}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {name}
              </label>
            </div>
          );
        } else {
          return (
            <div key={name} className="space-y-1 p-2 bg-gray-50 rounded-md">
              <label className="text-sm font-medium">{name}</label>
              <Select
                value={labelValues[name] as string}
                onValueChange={(value) => handleCategoryChange(name, value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-9 text-sm bg-white">
                  <SelectValue placeholder={`Select ${name}`} />
                </SelectTrigger>
                <SelectContent>
                  {definition.possible_values.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
      })}
    </div>
  );
};

export default InlineImageLabeler;
