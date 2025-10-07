import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from './pages/LanguageSelector';

export default function LanguageSelectorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // If language is already selected, skip this page
    const lang = localStorage.getItem('lang');
    if (lang) {
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  const handleSelect = (lang) => {
    localStorage.setItem('lang', lang);
    window.location.reload(); // reload to apply language
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
        <LanguageSelector onSelect={handleSelect} />
      </div>
    </div>
  );
}
