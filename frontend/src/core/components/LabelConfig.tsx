import React, { useState, useEffect } from 'react';
import { Button } from "@/core/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/core/components/ui/form";
import { Input } from "@/core/components/ui/input";
import { useForm } from "react-hook-form";
import { Type, ToggleRight, Plus, Trash2, Edit, Save, X, Loader2 } from "lucide-react";
import { Textarea } from "@/core/components/ui/textarea";
import { useParams } from "react-router-dom";
import { useToast } from "@/core/hooks/use-toast";
import { Badge } from "@/core/components/ui/badge";
import { Separator } from "@/core/components/ui/separator";
import { Card } from "@/core/components/ui/card";
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

// Match the backend schema
interface LabelCreationRequest {
  name: string;
  type: "boolean" | "category";
  description: string;
  possible_values: string[];
}

interface Dataset {
  id: string;
  name: string;
  description: string;
  labels: Record<string, LabelCreationRequest> | null;
  n_images: number;
  n_labeled_images: number;
  n_queued_images: number;
  created_at: string;
  updated_at: string;
}

interface LabelConfigProps {
  existingLabels?: Record<string, LabelCreationRequest> | null;
  onLabelsUpdated?: () => void;
}

const LabelConfig = ({ existingLabels = null, onLabelsUpdated }: LabelConfigProps) => {
  const { id: datasetId } = useParams<{ id: string }>();
  const [labels, setLabels] = useState<Record<string, LabelCreationRequest>>({});
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize labels from props if available
  useEffect(() => {
    if (existingLabels) {
      setLabels(existingLabels);
    }
  }, [existingLabels]);

  const form = useForm<LabelCreationRequest>({
    defaultValues: {
      name: '',
      type: 'category',
      description: '',
      possible_values: [],
    }
  });

  const selectedType = form.watch('type');
  const [newValue, setNewValue] = useState('');

  const resetForm = () => {
    form.reset({
      name: '',
      type: 'category',
      description: '',
      possible_values: [],
    });
    setEditingLabel(null);
  };

  const editLabel = (labelName: string) => {
    const label = labels[labelName];
    if (label) {
      form.reset({
        name: label.name,
        type: label.type,
        description: label.description,
        possible_values: [...label.possible_values],
      });
      setEditingLabel(labelName);
    }
  };

  const deleteLabel = async (labelName: string) => {
    // First update local state
    const updatedLabels = { ...labels };
    delete updatedLabels[labelName];
    setLabels(updatedLabels);
    
    if (editingLabel === labelName) {
      resetForm();
    }
    
    // Then save to backend
    await saveLabelsToBackend(updatedLabels);
  };

  const handleAddValue = () => {
    if (newValue.trim() && !form.getValues().possible_values.includes(newValue.trim())) {
      const currentValues = form.getValues().possible_values || [];
      form.setValue('possible_values', [...currentValues, newValue.trim()]);
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    const currentValues = form.getValues().possible_values;
    form.setValue('possible_values', currentValues.filter((_, i) => i !== index));
  };

  const saveLabelsToBackend = async (labelsToSave: Record<string, LabelCreationRequest> = labels) => {
    if (!datasetId) {
      toast({
        title: "Error",
        description: "Dataset ID is missing.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      // Convert labels object to array for API
      const labelsList = Object.values(labelsToSave);
      
      console.log('Sending labels to backend:', labelsList);
      
      const response = await fetch(ENDPOINTS.DATASET(datasetId), {
        method: 'PUT',
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          labels: labelsList,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update labels: ${response.statusText}`);
      }

      toast({
        title: "Labels updated",
        description: "The label configuration has been saved successfully.",
      });

      if (onLabelsUpdated) {
        onLabelsUpdated();
      }
      
      return true;
    } catch (error) {
      console.error('Error saving labels:', error);
      toast({
        title: "Failed to save labels",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: LabelCreationRequest) => {
    // Validate the form data
    if (!data.name.trim()) {
      toast({
        title: "Invalid label",
        description: "Label name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    if (data.type === 'category' && (!data.possible_values || data.possible_values.length === 0)) {
      toast({
        title: "Invalid label",
        description: "Category labels must have at least one possible value.",
        variant: "destructive",
      });
      return;
    }

    // Update local state first
    let updatedLabels: Record<string, LabelCreationRequest>;
    
    // If we're editing an existing label, remove the old one first
    if (editingLabel && editingLabel !== data.name) {
      const tempLabels = { ...labels };
      delete tempLabels[editingLabel];
      updatedLabels = {
        ...tempLabels,
        [data.name]: data,
      };
    } else {
      // Add or update the label
      updatedLabels = {
        ...labels,
        [data.name]: data,
      };
    }
    
    setLabels(updatedLabels);
    
    // Reset the form
    resetForm();
    
    // Save to backend immediately
    setIsSubmitting(true);
    const success = await saveLabelsToBackend(updatedLabels);
    
    if (success) {
      toast({
        title: "Label saved",
        description: `The label "${data.name}" has been saved to the dataset.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Labels */}
      {Object.keys(labels).length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Labels</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(labels).map(([name, label]) => (
              <Card key={name} className="p-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{label.name}</span>
                    <Badge variant={label.type === 'boolean' ? 'outline' : 'secondary'}>
                      {label.type === 'boolean' ? 'Boolean' : 'Category'}
                    </Badge>
                  </div>
                  {label.description && (
                    <p className="text-sm text-gray-500 mt-1">{label.description}</p>
                  )}
                  {label.type === 'category' && label.possible_values.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {label.possible_values.map((value, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => editLabel(name)}
                    disabled={isSubmitting}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteLabel(name)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator />
      
      {/* Add/Edit Label Form */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {editingLabel ? `Edit Label: ${editingLabel}` : 'Add New Label'}
          </h3>
          {editingLabel && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetForm}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Category" {...field} disabled={isSubmitting} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this label represents..." 
                      className="resize-none h-20"
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a label type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="category">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4" />
                          <span>Category</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="boolean">
                        <div className="flex items-center gap-2">
                          <ToggleRight className="w-4 h-4" />
                          <span>Boolean</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {selectedType === 'category' && (
              <div className="space-y-4 pt-2">
                <FormLabel>Possible Values</FormLabel>
                <div className="flex gap-2">
                  <Input 
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Enter a value"
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddValue}
                    variant="secondary"
                    disabled={isSubmitting}
                  >
                    Add
                  </Button>
                </div>
                
                <FormField
                  control={form.control}
                  name="possible_values"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-2">
                          {form.getValues().possible_values?.map((value, index) => (
                            <div key={index} className="flex items-center gap-2 bg-secondary/20 p-2 rounded-md">
                              <span>{value}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="ml-auto h-auto p-1"
                                onClick={() => handleRemoveValue(index)}
                                disabled={isSubmitting}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          {form.getValues().possible_values?.length === 0 && (
                            <div className="text-sm text-gray-500 italic">
                              No values added yet. Add at least one value.
                            </div>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingLabel ? 'Update Label' : 'Add Label'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default LabelConfig;
