import React, { useState, useEffect } from 'react';
import { FeatureFlag, getFeatureFlags, updateFeatureFlag } from '@/core/services/featureFlags';

interface AIFeaturesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIFeaturesDialog: React.FC<AIFeaturesDialogProps> = ({ isOpen, onClose }) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFeatureFlags();
    }
  }, [isOpen]);

  const loadFeatureFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      const flags = await getFeatureFlags();
      setFeatureFlags(flags);
    } catch (err) {
      setError('Failed to load feature flags. Please try again.');
      console.error('Error loading feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (flag: FeatureFlag) => {
    try {
      setLoading(true);
      const updatedFlag = await updateFeatureFlag(flag.name, !flag.enabled);
      
      // Update the feature flags list with the updated flag
      setFeatureFlags(prevFlags => 
        prevFlags.map(f => f.id === updatedFlag.id ? updatedFlag : f)
      );
    } catch (err) {
      setError('Failed to update feature flag. Please try again.');
      console.error('Error updating feature flag:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">AI Features</h2>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading && <p className="text-center py-4">Loading...</p>}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {!loading && featureFlags.length === 0 && (
            <p className="text-center py-4 text-gray-500">No feature flags available.</p>
          )}
          
          {featureFlags.map(flag => (
            <div key={flag.id} className="py-3 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{flag.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  {flag.description && (
                    <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={flag.enabled}
                    onChange={() => handleToggleFeature(flag)}
                    disabled={loading}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesDialog;
