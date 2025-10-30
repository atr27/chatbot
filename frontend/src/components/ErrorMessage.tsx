import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
            <p className="text-sm text-red-700">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
