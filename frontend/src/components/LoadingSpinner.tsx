import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Memuat...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
