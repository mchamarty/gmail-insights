import { AlertCircle, RefreshCw } from 'lucide-react';
import { APIError } from '@/lib/errors';

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const apiError = error instanceof APIError ? error : null;
  
  return (
    <div className="rounded-lg bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <h3 className="font-medium text-destructive">
            {apiError?.code ? apiError.code.split('_').join(' ').toLowerCase() : 'Error'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-destructive hover:text-destructive/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
