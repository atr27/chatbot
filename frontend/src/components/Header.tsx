import React from 'react';
import { Bot, Download, Upload, Trash2, Menu, X } from 'lucide-react';

interface HeaderProps {
  onExportAll: () => void;
  onImport: () => void;
  onClearAll: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  onExportAll, 
  onImport, 
  onClearAll,
  onToggleSidebar,
  isSidebarOpen 
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chatbot</h1>
              <p className="text-xs text-gray-500">Powered by Groq AI</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onImport}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Impor Riwayat"
          >
            <Upload className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={onExportAll}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ekspor Semua Riwayat"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Hapus semua riwayat chat?')) {
                onClearAll();
              }
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Semua Riwayat"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
