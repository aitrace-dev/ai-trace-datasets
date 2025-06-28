import React, { useState } from 'react';
import { Button } from '@/core/components/ui/button';
import { Checkbox } from '@/core/components/ui/checkbox';
import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

interface DownloadDatasetModalProps {
  open: boolean;
  onClose: () => void;
  datasetId: string;
}

const DownloadDatasetModal: React.FC<DownloadDatasetModalProps> = ({ open, onClose, datasetId }) => {
  const [showPythonSnippet, setShowPythonSnippet] = useState(false);
  const [onlyLabeled, setOnlyLabeled] = useState(true);

  const handleDownloadCSV = async () => {
    if (!datasetId) return;
    try {
      // Retrieve auth token from localStorage or other secure storage
      const token = localStorage.getItem('ai_trace_token');
      const response = await fetch(ENDPOINTS.EXPORT(datasetId, onlyLabeled, 'csv'),
        {
          method: 'GET',
          headers: {
            ...authHeaders(),
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to download CSV: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dataset.csv';
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      alert('Error downloading CSV.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      {!showPythonSnippet ? (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <h3 className="text-lg font-semibold mb-4">Download Dataset</h3>
          <div className="flex items-center mb-4">
            <Checkbox id="only-labeled" checked={onlyLabeled} onCheckedChange={checked => setOnlyLabeled(checked === true)} />
            <label htmlFor="only-labeled" className="ml-2 text-sm select-none cursor-pointer">Only labeled</label>
          </div>
          <div className="flex flex-col gap-4">
            <Button variant="secondary" onClick={handleDownloadCSV}>
              Download CSV
            </Button>
            <Button variant="outline" onClick={() => setShowPythonSnippet(true)}>
              Show Python Code
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
          <h3 className="text-lg font-semibold mb-4">Download Dataset with Python</h3>
          <pre className="bg-gray-100 rounded p-4 text-sm overflow-x-auto mb-4">
{`import requests\n\nurl = '${ENDPOINTS.EXPORT(datasetId, onlyLabeled, 'csv')}'\nheaders = {'Authorization': 'Bearer <YOUR_TOKEN>'}\n\nresponse = requests.get(url, headers=headers)\nwith open('dataset.csv', 'wb') as f:\n    f.write(response.content)\n`}
          </pre>
          <Button onClick={() => setShowPythonSnippet(false)} className="w-full mt-2">Back</Button>
        </div>
      )}
    </div>
  );
};

export default DownloadDatasetModal;
