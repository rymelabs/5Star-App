import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check, Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { language, changeLanguage, availableLanguages, t } = useLanguage();

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="w-6 h-6 text-primary-500" />
        <h2 className="text-lg font-semibold text-white">{t('pages.settings.language')}</h2>
      </div>
      
      <p className="text-sm text-gray-400 mb-4">
        {t('pages.settings.selectLanguage')}
      </p>

      <div className="space-y-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
              language === lang.code
                ? 'bg-primary-600 text-white border-2 border-primary-500'
                : 'bg-dark-700 text-gray-300 hover:bg-dark-600 border-2 border-dark-600'
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-sm opacity-75">{lang.name}</span>
            </div>
            
            {language === lang.code && (
              <Check className="w-5 h-5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
