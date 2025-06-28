import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/core/components/ui/table";
import DatasetCard from '@/core/components/DatasetCard';

import { authHeaders } from "@/core/utils/auth";
import { ENDPOINTS } from '@/config';

interface Dataset {
  id: string;
  name: string;
  n_images: number;
  n_queued_images: number;
  n_labeled_images: number;
  updated_at: string;
  description: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch(ENDPOINTS.DATASETS, { headers: authHeaders() });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setDatasets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
        console.error('Error fetching datasets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Image Datasets</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => navigate("/new-dataset")}
        >
          New Dataset
        </button>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-4 text-center">Loading datasets...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Error: {error}</div>
        ) : datasets.length === 0 ? (
          <div className="p-4 text-center">No datasets available. Create one to get started.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>In Annotation Queue</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  name={dataset.name}
                  imageCount={dataset.n_images}
                  queuedCount={dataset.n_queued_images}
                  lastUpdated={new Date(dataset.updated_at).toLocaleDateString()}
                  onClick={() => navigate(`/dataset/${dataset.id}`)}
                  onRemove={async () => {
                    if (!window.confirm(`Are you sure you want to remove dataset '${dataset.name}'? This action cannot be undone.`)) return;
                    try {
                      const response = await fetch(ENDPOINTS.DATASET(dataset.id), {
                        method: 'DELETE',
                        headers: authHeaders(),
                      });
                      if (!response.ok) {
                        throw new Error('Failed to delete dataset');
                      }
                      setDatasets(prev => prev.filter(d => d.id !== dataset.id));
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Failed to delete dataset');
                    }
                  }}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Index;
