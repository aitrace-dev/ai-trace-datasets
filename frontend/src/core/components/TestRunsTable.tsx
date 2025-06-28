import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/core/components/ui/table';
import { Badge } from '@/core/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export interface TestRun {
  id: string;
  description: string;
  run_start_time: string;
  run_end_time: string;
  status: 'running' | 'completed' | 'failed' | 'stopped' | 'error';
  precision: number;
  recall: number;
  accuracy: number;
  f1_score: number;
  n_test_cases: number;
  extra_metrics: Record<string, number | string>;
}

interface TestRunsTableProps {
  testRuns: TestRun[];
  loading: boolean;
}

// Component to display extra metrics as key/value pairs
const ExtraMetrics: React.FC<{ metrics: Record<string, number | string> }> = ({ metrics }) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return <span className="text-gray-400">None</span>;
  }

  // Format number to hide decimal places if it's a whole number
  const formatNumber = (value: number) => {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  };

  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
      {Object.entries(metrics).map(([key, value]) => (
        <React.Fragment key={key}>
          <div className="font-medium text-gray-700">{key}:</div>
          <div className="text-gray-900">{typeof value === 'number' ? formatNumber(value) : value}</div>
        </React.Fragment>
      ))}
    </div>
  );
};

const TestRunsTable: React.FC<TestRunsTableProps> = ({ testRuns, loading }) => {
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'stopped':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Stopped</Badge>;
      case 'error':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
    }
  };

  // Format metric value to hide decimal places if it's a whole number
  const formatMetric = (value: number) => {
    if (value === null || value === undefined) return '-';
    
    // Convert to percentage and check if it's a whole number
    const percentage = value * 100;
    return Number.isInteger(percentage) ? `${percentage}%` : `${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (testRuns.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No test runs found for this dataset.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Test Cases</TableHead>
            <TableHead>Precision</TableHead>
            <TableHead>Recall</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Extra Metrics</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testRuns.map((testRun) => (
            <TableRow key={testRun.id}>
              <TableCell className="font-medium">{testRun.description || '-'}</TableCell>
              <TableCell>{formatDate(testRun.run_start_time)}</TableCell>
              <TableCell>{testRun.run_end_time ? formatDate(testRun.run_end_time) : '-'}</TableCell>
              <TableCell>{getStatusBadge(testRun.status)}</TableCell>
              <TableCell>{testRun.n_test_cases || '-'}</TableCell>
              <TableCell>{testRun.status === 'completed' ? formatMetric(testRun.precision) : '-'}</TableCell>
              <TableCell>{testRun.status === 'completed' ? formatMetric(testRun.recall) : '-'}</TableCell>
              <TableCell>{testRun.status === 'completed' ? formatMetric(testRun.accuracy) : '-'}</TableCell>
              <TableCell><ExtraMetrics metrics={testRun.extra_metrics || {}} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TestRunsTable;
