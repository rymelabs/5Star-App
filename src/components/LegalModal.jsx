import React from 'react';
import { X } from 'lucide-react';

const LegalModal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-dark-900 rounded-lg shadow-xl border border-dark-700 p-6 z-10">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto text-gray-300 prose prose-invert">
          {children}
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
