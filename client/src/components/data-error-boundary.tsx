/**
 * Data-specific Error Boundary
 * Handles errors related to data loading and processing
 */

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, RefreshCw, AlertTriangle, Settings } from 'lucide-react';

interface DataErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  dataSource?: string;
  resetKeys?: Array<string | number>;
}

export const DataErrorBoundary: React.FC<DataErrorBoundaryProps> = ({
  children,
  onRetry,
  dataSource,
  resetKeys
}) => {
  const fallback = (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-destructive" />
          <div>
            <CardTitle>Data Loading Error</CardTitle>
            <CardDescription>
              Failed to load or process vehicle data
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            The data source "{dataSource || 'unknown'}" could not be loaded.
            This might be due to:
          </AlertDescription>
        </Alert>

        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Network connectivity issues</li>
          <li>Invalid or corrupted data files</li>
          <li>Python backend not available</li>
          <li>Insufficient permissions to read files</li>
        </ul>

        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Loading
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/trip-loader'}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Choose Different Data
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Try loading demo data or check your data source configuration.
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary
      fallback={fallback}
      resetKeys={resetKeys}
      resetOnPropsChange={true}
      showDetails={false}
    >
      {children}
    </ErrorBoundary>
  );
};