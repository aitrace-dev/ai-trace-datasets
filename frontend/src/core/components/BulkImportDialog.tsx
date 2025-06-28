import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/core/components/ui/dialog';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Label } from '@/core/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/core/components/ui/select';
import { Progress } from '@/core/components/ui/progress';
import { useToast } from '@/core/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Plus } from 'lucide-react';
import Papa from 'papaparse';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/core/components/ui/accordion';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

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

interface LabelDefinition {
  name: string;
  type: "boolean" | "category";
  description: string;
  possible_values: string[];
}

interface LabelMapping {
  labelName: string;
  columnName: string;
  enabled: boolean;
}

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  onImagesUploaded: (images: DatasetImage[]) => void;
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  isOpen,
  onClose,
  datasetId,
  onImagesUploaded
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    images: DatasetImage[];
  }>({
    success: 0,
    failed: 0,
    images: []
  });
  const [datasetLabels, setDatasetLabels] = useState<Record<string, LabelDefinition>>({});
  const [labelMappings, setLabelMappings] = useState<LabelMapping[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [nameMapping, setNameMapping] = useState<{ enabled: boolean; columnName: string }>({ enabled: false, columnName: '' });
  const { toast } = useToast();

  // Fetch dataset labels when dialog opens
  useEffect(() => {
    if (isOpen && datasetId) {
      fetchDatasetLabels();
    }
  }, [isOpen, datasetId]);

  // Fetch dataset labels from the API
  const fetchDatasetLabels = async () => {
    if (!datasetId) return;
    
    setIsLoadingLabels(true);
    
    try {
      const response = await fetch(ENDPOINTS.DATASET(datasetId), { headers: authHeaders() });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dataset: ${response.statusText}`);
      }
      
      const dataset = await response.json();
      
      if (dataset.labels && Array.isArray(dataset.labels)) {
        const labelsObject: Record<string, LabelDefinition> = {};
        
        dataset.labels.forEach((label: LabelDefinition) => {
          labelsObject[label.name] = label;
        });
        
        setDatasetLabels(labelsObject);
        
        // Initialize label mappings
        const mappings: LabelMapping[] = Object.keys(labelsObject).map(name => ({
          labelName: name,
          columnName: '',
          enabled: false
        }));
        
        setLabelMappings(mappings);
      }
    } catch (error) {
      console.error('Error fetching dataset labels:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dataset labels",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLabels(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file);
        parseCSV(file);
      } else {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  // Parse CSV file
  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setCsvData(results.data);
          
          // Extract column headers
          const firstRow = results.data[0];
          if (firstRow) {
            const headers = Object.keys(firstRow);
            setColumns(headers);
            
            // Try to find a column that might contain image URLs
            const possibleUrlColumns = headers.filter(header => 
              header.toLowerCase().includes('url') || 
              header.toLowerCase().includes('image') || 
              header.toLowerCase().includes('img')
            );
            
            if (possibleUrlColumns.length > 0) {
              setSelectedColumn(possibleUrlColumns[0]);
            } else if (headers.length > 0) {
              setSelectedColumn(headers[0]);
            }
            
            // Try to find a column that might contain image names
            const possibleNameColumns = headers.filter(header => header.toLowerCase().includes('name'));
            if (possibleNameColumns.length > 0) {
              setNameMapping({ enabled: true, columnName: possibleNameColumns[0] });
            } else {
              setNameMapping({ enabled: false, columnName: '' });
            }
            
            // Try to match label names with column names
            if (labelMappings.length > 0) {
              const updatedMappings = [...labelMappings];
              
              updatedMappings.forEach((mapping, index) => {
                // Look for exact matches first
                const exactMatch = headers.find(header => 
                  header.toLowerCase() === mapping.labelName.toLowerCase()
                );
                
                if (exactMatch) {
                  updatedMappings[index] = {
                    ...mapping,
                    columnName: exactMatch,
                    enabled: true
                  };
                } else {
                  // Look for partial matches
                  const partialMatch = headers.find(header => 
                    header.toLowerCase().includes(mapping.labelName.toLowerCase())
                  );
                  
                  if (partialMatch) {
                    updatedMappings[index] = {
                      ...mapping,
                      columnName: partialMatch,
                      enabled: true
                    };
                  }
                }
              });
              
              setLabelMappings(updatedMappings);
            }
          }
        } else {
          toast({
            title: "Empty CSV file",
            description: "The uploaded CSV file doesn't contain any data.",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast({
          title: "CSV parsing error",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  // Reset state when dialog closes
  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
      if (!isProcessing) {
        resetState();
      }
    }
  };

  // Reset all state
  const resetState = () => {
    setCsvFile(null);
    setCsvData(null);
    setColumns([]);
    setSelectedColumn('');
    setIsProcessing(false);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(0);
    setResults({
      success: 0,
      failed: 0,
      images: []
    });
    setNameMapping({ enabled: false, columnName: '' });
    // Don't reset label mappings as they depend on dataset labels
  };

  // Update a label mapping
  const updateLabelMapping = (index: number, field: keyof LabelMapping, value: any) => {
    const updatedMappings = [...labelMappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      [field]: value
    };
    setLabelMappings(updatedMappings);
  };

  // Parse a value based on the label type
  const parseValueForLabel = (value: any, labelName: string): boolean | string => {
    const label = datasetLabels[labelName];
    
    if (!label) return value;
    
    if (label.type === 'boolean') {
      // Handle boolean values
      if (typeof value === 'boolean') return value;
      
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        
        // Check for common boolean string representations
        if (['true', 't', 'yes', 'y', '1'].includes(lowerValue)) {
          return true;
        }
        
        if (['false', 'f', 'no', 'n', '0'].includes(lowerValue)) {
          return false;
        }
      }
      
      if (typeof value === 'number') {
        return value !== 0;
      }
      
      // Default to false for any other value
      return false;
    } else if (label.type === 'category') {
      // Handle category values
      const stringValue = String(value).trim();
      
      // Check if the value is in the possible values
      if (label.possible_values.includes(stringValue)) {
        return stringValue;
      }
      
      // Try case-insensitive match
      const lowerValue = stringValue.toLowerCase();
      const matchingValue = label.possible_values.find(v => 
        v.toLowerCase() === lowerValue
      );
      
      if (matchingValue) {
        return matchingValue;
      }
      
      // Default to the first possible value
      return label.possible_values.length > 0 ? label.possible_values[0] : '';
    }
    
    // Default to string representation
    return String(value);
  };

  // Process all images from the CSV
  const processImages = async () => {
    if (!csvData || !selectedColumn || csvData.length === 0) {
      toast({
        title: "Missing data",
        description: "Please upload a CSV file and select a column containing image URLs.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessedCount(0);
    setTotalCount(csvData.length);
    setResults({
      success: 0,
      failed: 0,
      images: []
    });

    const successfulImages: DatasetImage[] = [];
    let successCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    // Process each row one at a time
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const imageUrl = row[selectedColumn];
      
      if (imageUrl && typeof imageUrl === 'string') {
        try {
          // Prepare name if mapping is enabled
          let name = null;
          if (nameMapping.enabled && nameMapping.columnName) {
            name = row[nameMapping.columnName] || null;
          }
          
          // Prepare labels if mappings are defined
          const labelUpdates = [];
          if (Object.keys(datasetLabels).length > 0) {
            labelMappings.forEach(mapping => {
              if (mapping.enabled && mapping.columnName && row[mapping.columnName] !== undefined) {
                labelUpdates.push({
                  name: mapping.labelName,
                  value: parseValueForLabel(
                    row[mapping.columnName], 
                    mapping.labelName
                  )
                });
              }
            });
          }
          
          // Determine if image is labeled based on whether it has any labels
          const isLabeled = labelUpdates.length > 0;
          
          // Create import request
          const importRequest = {
            url: imageUrl,
            name: name,
            description: null,
            labels: labelUpdates,
            is_labeled: isLabeled
          };
          
          // Send request to backend
          const response = await fetch(ENDPOINTS.UPLOAD_IMAGE_BY_URL(datasetId), {
            method: 'POST',
            headers: { 
              ...authHeaders(),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(importRequest)
          });
          
          if (response.status === 409) {
            // Image already exists - this is a duplicate, not a failure
            conflictCount++;
            console.log(`Duplicate image skipped: ${imageUrl}`);
          } else if (!response.ok) {
            throw new Error(`Import failed: ${response.statusText}`);
          } else {
            // Success
            const imageData = await response.json();
            successCount++;
            successfulImages.push(imageData);
          }
        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
          failedCount++;
        }
      } else {
        // Invalid URL
        failedCount++;
      }
      
      // Update progress
      setProcessedCount(i + 1);
      setProgress(Math.round(((i + 1) / csvData.length) * 100));
    }
    
    // Update results
    setResults({
      success: successCount,
      failed: failedCount,
      images: successfulImages
    });
    
    // Show success message
    toast({
      title: "Bulk import completed",
      description: `Successfully imported ${successCount} images. ${conflictCount} duplicates skipped. ${failedCount} failed.`,
    });
    
    // Show warning for duplicates if any were found
    if (conflictCount > 0) {
      toast({
        title: "Duplicates detected",
        description: `${conflictCount} duplicate images were not saved.`,
        variant: "destructive",
      });
    }
    
    // Refresh dataset images
    if (successCount > 0) {
      onImagesUploaded(successfulImages);
    }
    
    setIsProcessing(false);
  };

  // Handle completion
  const handleComplete = () => {
    if (results.success > 0) {
      toast({
        title: "Bulk import completed",
        description: `Successfully imported ${results.success} images. Failed: ${results.failed}`,
      });
    } else {
      toast({
        title: "Bulk import failed",
        description: "No images were successfully imported.",
        variant: "destructive",
      });
    }
    
    onClose();
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Images</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-4">
          {!isProcessing && !results.images.length ? (
            <div className="space-y-6">
              {!csvFile ? (
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('csv-file-input')?.click()}
                >
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload a CSV file
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The CSV should contain a column with image URLs
                  </p>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">{csvFile.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={() => {
                        setCsvFile(null);
                        setCsvData(null);
                        setColumns([]);
                        setSelectedColumn('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  
                  {columns.length > 0 && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="column-select">Select Image URL Column</Label>
                        <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                          <SelectTrigger id="column-select">
                            <SelectValue placeholder="Select a column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.map(column => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name-mapping-checkbox">Map Image Name Column</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="name-mapping-checkbox"
                            checked={nameMapping.enabled}
                            onCheckedChange={checked => setNameMapping(nm => ({ ...nm, enabled: Boolean(checked) }))}
                          />
                          <Select
                            value={nameMapping.columnName}
                            onValueChange={value => setNameMapping(nm => ({ ...nm, columnName: value }))}
                            disabled={!nameMapping.enabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a column" />
                            </SelectTrigger>
                            <SelectContent>
                              {columns.map(column => (
                                <SelectItem key={column} value={column}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {csvData && (
                          <p>Found {csvData.length} rows in the CSV file.</p>
                        )}
                      </div>
                      
                      {/* Label Mappings */}
                      {Object.keys(datasetLabels).length > 0 && (
                        <Accordion type="single" collapsible defaultValue="labels">
                          <AccordionItem value="labels">
                            <AccordionTrigger>
                              Map CSV Columns to Labels
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                <p className="text-sm text-muted-foreground">
                                  Map columns from your CSV to dataset labels. This will apply these labels to imported images.
                                </p>
                                
                                {labelMappings.map((mapping, index) => (
                                  <div key={mapping.labelName} className="flex items-center gap-2 py-2 border-b">
                                    <Checkbox 
                                      id={`label-${index}`}
                                      checked={mapping.enabled}
                                      onCheckedChange={(checked) => 
                                        updateLabelMapping(index, 'enabled', Boolean(checked))
                                      }
                                    />
                                    <div className="flex-grow grid grid-cols-2 gap-2">
                                      <div>
                                        <Label htmlFor={`label-${index}`} className="text-sm">
                                          {mapping.labelName}
                                          <span className="ml-2 text-xs text-muted-foreground">
                                            ({datasetLabels[mapping.labelName]?.type})
                                          </span>
                                        </Label>
                                      </div>
                                      <Select 
                                        value={mapping.columnName} 
                                        onValueChange={(value) => 
                                          updateLabelMapping(index, 'columnName', value)
                                        }
                                        disabled={!mapping.enabled}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {columns.map(column => (
                                            <SelectItem key={column} value={column}>
                                              {column}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : isProcessing ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Processing images...</p>
                <p className="text-xs text-muted-foreground">
                  {processedCount} of {totalCount} ({Math.round((processedCount / totalCount) * 100)}%)
                </p>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <div className="text-xs text-muted-foreground">
                <p>This may take a while depending on the number of images and their sizes.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-lg font-medium">{results.success}</p>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </div>
                
                <div className="text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-lg font-medium">{results.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
              
              <div className="text-sm text-center">
                {results.success > 0 ? (
                  <p>Successfully imported {results.success} images to your dataset.</p>
                ) : (
                  <p className="text-red-500">No images were successfully imported.</p>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter className="pt-4">
          {!isProcessing && !results.images.length ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={processImages}
                disabled={!csvFile || !selectedColumn}
              >
                <Upload className="mr-2 h-4 w-4" />
                Process Images
              </Button>
            </>
          ) : isProcessing ? (
            <Button variant="outline" onClick={onClose} disabled>
              Cancel
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
