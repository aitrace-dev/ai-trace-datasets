import React, { useState, useEffect } from 'react';
import { Button } from "@/core/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/core/components/ui/form";
import { useForm } from "react-hook-form";
import { Loader2, Save, X } from "lucide-react";
import { useToast } from "@/core/hooks/use-toast";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { Checkbox } from "@/core/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/core/components/ui/dialog";
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

interface ImageLabelEditorProps {
  imageId: string;
  datasetId: string;
  currentLabels: Record<string, any> | null;
  datasetLabels: Record<string, LabelDefinition> | null;
  onLabelsUpdated: () => void;
}

const ImageLabelEditor = ({ 
  imageId, 
  datasetId, 
  currentLabels, 
  datasetLabels, 
  onLabelsUpdated 
}: ImageLabelEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<Record<string, boolean | string>>({
    defaultValues: {},
  });
  
  // Initialize form with current labels when dialog opens
  useEffect(() => {
    if (isOpen && currentLabels) {
      const formValues: Record<string, boolean | string> = {};
      
      // Initialize with current values
      Object.entries(currentLabels).forEach(([key, value]) => {
        formValues[key] = value;
      });
      
      // Add any missing labels from dataset with default values
      if (datasetLabels) {
        Object.entries(datasetLabels).forEach(([name, def]) => {
          if (formValues[name] === undefined) {
            formValues[name] = def.type === 'boolean' ? false : (def.possible_values[0] || '');
          }
        });
      }
      
      form.reset(formValues);
    }
  }, [isOpen, currentLabels, datasetLabels, form]);
  
  const onSubmit = async (data: Record<string, boolean | string>) => {
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
      // Convert form data to the expected format for the API
      const labelUpdates: LabelUpdateRequest[] = Object.entries(data).map(([name, value]) => ({
        name,
        value
      }));
      
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
      
      onLabelsUpdated();
      setIsOpen(false);
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
  
  const renderLabelField = (name: string, definition: LabelDefinition) => {
    if (definition.type === 'boolean') {
      return (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">
                  {name}
                </FormLabel>
                {definition.description && (
                  <p className="text-sm text-muted-foreground">{definition.description}</p>
                )}
              </div>
            </FormItem>
          )}
        />
      );
    } else {
      return (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{name}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value as string}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${name}`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {definition.possible_values.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {definition.description && (
                <p className="text-xs text-muted-foreground">{definition.description}</p>
              )}
            </FormItem>
          )}
        />
      );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Labels
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Image Labels</DialogTitle>
        </DialogHeader>
        
        {!datasetLabels || Object.keys(datasetLabels).length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">
              No labels have been defined for this dataset yet.
            </p>
            <p className="text-sm mt-2">
              Go to dataset settings to define labels first.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                {datasetLabels && Object.entries(datasetLabels).map(([name, definition]) => 
                  renderLabelField(name, definition)
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Labels
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageLabelEditor;
