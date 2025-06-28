import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Textarea } from "@/core/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { Loader2 } from "lucide-react";
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

// Interface for dataset schema
interface DatasetSchema {
  name: string;
  description: string;
  schema_definition: {
    type: string;
    required?: string[];
    properties: Record<string, any>;
  };
}

const CreateDatasetDialog = () => {
  const [aiNameCreationEnabled, setAiNameCreationEnabled] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [schemas, setSchemas] = useState<DatasetSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSchemas, setIsFetchingSchemas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // Fetch available schemas when dialog opens
  useEffect(() => {
    if (open) {
      fetchSchemas();
    }
  }, [open]);
  
  // Function to fetch available dataset schemas
  const fetchSchemas = async () => {
    setIsFetchingSchemas(true);
    try {
      const response = await fetch(ENDPOINTS.DATASET_SCHEMAS, {
        headers: authHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schemas: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSchemas(data);
      
      // Set default schema if available
      if (data.length > 0) {
        setSelectedSchema(data[0].name);
      }
    } catch (error) {
      console.error('Error fetching schemas:', error);
      setError('Failed to load dataset schemas. Please try again.');
    } finally {
      setIsFetchingSchemas(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Dataset name is required');
      return;
    }
    
    if (!selectedSchema) {
      setError('Please select a dataset schema');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(ENDPOINTS.DATASETS, {
        method: 'POST',
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          schema: selectedSchema,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || `Error creating dataset: ${response.status}`
        );
      }

      const data = await response.json();
      setOpen(false);
      // Navigate to the new dataset page
      navigate(`/dataset/${data.id}`);
    } catch (err) {
      console.error('Error creating dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to create dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setName('');
      setDescription('');
      setSelectedSchema('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Create Dataset</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Dataset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Dataset Name</Label>
            <Input
              id="name"
              placeholder="My Dataset"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter a description for your dataset..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schema">Dataset Schema</Label>
            {isFetchingSchemas ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading schemas...</span>
              </div>
            ) : (
              <Select
                value={selectedSchema}
                onValueChange={setSelectedSchema}
                disabled={isLoading || schemas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a schema" />
                </SelectTrigger>
                <SelectContent>
                  {schemas.map((schema) => (
                    <SelectItem key={schema.name} value={schema.name}>
                      <div>
                        <span className="font-medium">{schema.name}</span>
                        <p className="text-xs text-muted-foreground">{schema.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedSchema && (
              <div className="mt-2 text-sm text-muted-foreground">
                {schemas.find(s => s.name === selectedSchema)?.description}
              </div>
            )}
          </div>
          {/* AI Name Creation Toggle */}
          <div className="flex items-center justify-between border rounded-lg px-4 py-3 mt-2 bg-gray-50">
            <div>
              <div className="font-medium">AI Name Creation</div>
              <div className="text-sm text-gray-500">Enable AI-generated name creation for datasets and other resources</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={aiNameCreationEnabled}
                onChange={() => setAiNameCreationEnabled(v => !v)}
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Dataset'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDatasetDialog;
