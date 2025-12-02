import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatsFilter = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option", 
  label,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option) => {
    if (onChange) {
      onChange({ target: { value: option.value } });
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-black border border-white/10 rounded-xl 
          text-left text-sm transition-all duration-200
          ${isOpen ? 'border-brand-purple ring-1 ring-brand-purple/50' : 'hover:border-white/20'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-white'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-2 overflow-hidden bg-black border border-white/10 rounded-xl shadow-xl shadow-black/50"
          >
            <div className="max-h-60 overflow-auto py-1 custom-scrollbar">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options available
                </div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
                      border-b border-white/5 last:border-0
                      ${option.value === value 
                        ? 'bg-black text-brand-purple font-semibold' 
                        : 'bg-black text-gray-300 hover:bg-[#1a1a1a] hover:text-white'}
                    `}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-brand-purple flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatsFilter;
