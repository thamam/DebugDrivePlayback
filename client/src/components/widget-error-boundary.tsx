/**
 * Widget-specific Error Boundary
 * Handles errors in widget creation and rendering
 */

import React from 'react';
import { ErrorBoundary } from './error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Grid, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  widgetName?: string;
  onRemove?: () => void;
  onReset?: () => void;
  widgetId?: string;
}

export const WidgetErrorBoundary: React.FC<WidgetErrorBoundaryProps> = ({
  children,
  widgetName,
  onRemove,
  onReset,
  widgetId
}) => {
  const fallback = (
    <Card className="w-full border-destructive">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-lg">Widget Error</CardTitle>
              <CardDescription>
                {widgetName ? `"${widgetName}" widget crashed` : 'Widget failed to render'}
              </CardDescription>
            </div>
          </div>
          {onRemove && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onRemove}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This widget encountered an error and stopped working.
          </AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground">
          <p>Common causes:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Invalid widget configuration</li>
            <li>Missing or corrupted data</li>
            <li>Widget template issues</li>
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          {onReset && (
            <Button
              size="sm"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Widget
            </Button>
          )}
          
          {onRemove && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRemove}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        {widgetId && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Widget ID: <code className="bg-muted px-1 rounded">{widgetId}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary
      fallback={fallback}
      resetKeys={widgetId ? [widgetId] : undefined}
      showDetails={false}
      onError={(error, errorInfo) => {
        console.error(`Widget error in ${widgetName || 'unknown widget'}:`, error, errorInfo);
        
        // Report widget-specific errors
        if (process.env.NODE_ENV === 'production') {
          // Send to monitoring service with widget context
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};